const HADIAH = "Hadiah", LOG = "Hasil Putaran";

function setupRoda() {
  const ss = SpreadsheetApp.getActive(), data = [
    ["ID","Nama Hadiah","Bobot","Stok","Aktif","Warna"],
    ["H01","Voucher 10%",35,100,true,"#2563EB"],
    ["H02","Voucher 20%",25,60,true,"#F97316"],
    ["H03","Gratis Ongkir",20,50,true,"#16A34A"],
    ["H04","Produk Gratis",10,20,true,"#9333EA"],
    ["H05","Hadiah Utama",1,1,true,"#DC2626"],
    ["H06","Coba Lagi",9,9999,true,"#64748B"]
  ];
  if (!ss) throw Error("Buka Apps Script dari Google Sheets.");
  PropertiesService.getScriptProperties().setProperty("ID", ss.getId());
  const h = sheet_(HADIAH, ss), l = sheet_(LOG, ss);
  h.clear().getRange(1,1,data.length,6).setValues(data);
  l.clear().getRange(1,1,1,8).setValues([[
    "Waktu","Nama","Kontak","Client ID","ID Hadiah","Hadiah","Status","Kode Klaim"
  ]]);
  [h,l].forEach(s => { s.setFrozenRows(1); s.autoResizeColumns(1,s.getLastColumn()); });
}

function doGet(e) {
  return run_(() => {
    if (e.parameter.action !== "config") throw Error("Action tidak valid.");
    return {ok:true, prizes:prizes_().map(p => ({id:p.id,name:p.name,color:p.color}))};
  });
}

function doPost(e) {
  return run_(() => spin_(JSON.parse(e.postData.contents || "{}")));
}

function spin_(b) {
  if (b.action !== "spin") throw Error("Action tidak valid.");
  const name = clean_(b.name,80), contact = clean_(b.contact,120).toLowerCase();
  if (!name || !contact) throw Error("Nama dan kontak wajib diisi.");

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const ss = ss_(), log = ss.getSheetByName(LOG), last = log.getLastRow();
    if (last > 1 && log.getRange(2,3,last-1,1).getDisplayValues()
      .some(r => r[0].trim().toLowerCase() === contact))
      throw Error("Kontak ini sudah pernah melakukan putaran.");

    const list = prizes_();
    if (!list.length) throw Error("Hadiah sedang tidak tersedia.");
    let n = Math.random() * list.reduce((a,p) => a + p.weight, 0), prize = list[0];
    for (const p of list) if ((n -= p.weight) < 0) { prize = p; break; }

    ss.getSheetByName(HADIAH).getRange(prize.row,4).setValue(prize.stock - 1);
    const code = Utilities.getUuid().slice(0,8).toUpperCase();
    log.appendRow([new Date(),name,contact,clean_(b.clientId,100),prize.id,prize.name,"Belum Diklaim",code]);
    return {ok:true, prize:{id:prize.id,name:prize.name}, message:"Kode klaim Anda: " + code};
  } finally {
    lock.releaseLock();
  }
}

function prizes_() {
  const s = ss_().getSheetByName(HADIAH), last = s.getLastRow();
  if (last < 2) return [];
  return s.getRange(2,1,last-1,6).getValues().map((r,i) => ({
    row:i+2, id:String(r[0]).trim(), name:String(r[1]).trim(),
    weight:+r[2], stock:+r[3], active:r[4] === true, color:String(r[5]).trim() || "#2563EB"
  })).filter(p => p.id && p.name && p.weight > 0 && p.stock > 0 && p.active);
}

function ss_() {
  const id = PropertiesService.getScriptProperties().getProperty("ID");
  if (!id) throw Error("Jalankan setupRoda terlebih dahulu.");
  return SpreadsheetApp.openById(id);
}

function sheet_(name, ss) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function clean_(v,n) {
  return String(v || "").trim().slice(0,n);
}

function run_(fn) {
  try { return json_(fn()); }
  catch (e) { return json_({ok:false,error:e.message}); }
}

function json_(v) {
  return ContentService.createTextOutput(JSON.stringify(v)).setMimeType(ContentService.MimeType.JSON);
}
