// ID Spreadsheet anda
const SHEET_ID = '1Vwv--4En_xUeJ8Kaal1oqH3pSJxuK1DPTvHJwPkXBps';
const SHEET_NAME = 'Events';
const GCAL_ID = 'sekolah-5521-cm1@moe-dl.edu.my'; // ID Kalendar Rasmi Sekolah

// --- FUNGSI UNTUK MEMICU PERMISSION (JALANKAN SEKALI SECARA MANUAL) ---
function testConnection() {
  console.log("Menguji sambungan ke Spreadsheet...");
  const ss = SpreadsheetApp.openById(SHEET_ID);
  console.log("Spreadsheet OK: " + ss.getName());
  
  console.log("Menguji sambungan ke Google Calendar...");
  const cal = CalendarApp.getCalendarById(GCAL_ID);
  if (cal) {
    console.log("Calendar OK: " + cal.getName());
  } else {
    console.log("Calendar TIDAK DITEMUI atau tiada akses. Pastikan ID betul dan kalendar 'Public' atau dikongsi dengan akaun ini.");
  }
}
// ---------------------------------------------------------------------

// ---------------------------------------------------------------------
function formatDateForSheet(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function setupSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['id', 'start_date', 'end_date', 'title', 'category']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#f3f4f6');
  }
  return sheet;
}

// --- CREATE / UPDATE / DELETE / BULK ---
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000); 

  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const source = data.source; // 'gcal' or 'draft'
    const targetGCalId = data.gcal_id || GCAL_ID;

    // >>> Handle Google Calendar Operations (Create/Update/Delete Directly)
    if (source === 'gcal' && action !== 'copy_to_gcal') {
       return handleGCalPost(data, targetGCalId);
    }

    // >>> Handle Sheets Operations (Default)
    const sheet = setupSheet();
    
    // --- SPECIAL ACTION: Copy from Draft (Sheet) to GCal ---
    if (action === 'copy_to_gcal') {
         // 1. Find event in Sheet
         const rows = sheet.getDataRange().getValues();
         rows.shift(); // header
         
         const row = rows.find(r => r[0] === data.id); // ID is col 0
         if (!row) return response({status: 'error', message: 'Event not found in draft'});

         // 2. Extract Data
         const startVal = row[1];
         const endVal = row[2];
         const title = row[3];
         // const category = row[4];

         // 3. Create in GCal
         let cal = CalendarApp.getCalendarById(targetGCalId);
         if (!cal) {
           cal = CalendarApp.getDefaultCalendar();
         }
         if (!cal) return response({status: 'error', message: 'Calendar not found: ' + targetGCalId});

         const start = new Date(startVal);
         const end = new Date(endVal || startVal);
         // Exclusive end date for GCal
         end.setDate(end.getDate() + 1);

         const evt = cal.createAllDayEvent(title, start, end);
         return response({status: 'success', id: evt.getId(), message: 'Copied to GCal successfully'});
    }

    else if (action === 'create') {
      const id = Utilities.getUuid();
      const endDate = data.end || data.start;
      sheet.appendRow([id, data.start, endDate, data.title, data.category]);
      return response({ status: 'success', message: 'Event created', id: id });
    }
    
    else if (action === 'bulk_create') {
      const newEvents = data.events; 
      if (!newEvents || !Array.isArray(newEvents) || newEvents.length === 0) {
        return response({ status: 'error', message: 'No events provided' });
      }

      const rows = sheet.getDataRange().getValues();
      rows.shift(); // Remove header
      
      const existingSignatures = new Set();
      rows.forEach(row => {
        const dateStr = formatDate(row[1]); 
        const titleStr = String(row[3]).trim().toLowerCase();
        existingSignatures.add(`${dateStr}|${titleStr}`);
      });

      const eventsToAdd = [];
      let addedCount = 0;
      let duplicateCount = 0;

      newEvents.forEach(evt => {
        const evtStart = evt.start;
        const evtEnd = evt.end || evt.start;
        const evtTitle = String(evt.title).trim();
        const signature = `${evtStart}|${evtTitle.toLowerCase()}`;

        if (!existingSignatures.has(signature)) {
            const id = Utilities.getUuid();
            eventsToAdd.push([id, evtStart, evtEnd, evtTitle, evt.category || 'academic']);
            existingSignatures.add(signature);
            addedCount++;
        } else {
            duplicateCount++;
        }
      });

      if (eventsToAdd.length > 0) {
        sheet.getRange(sheet.getLastRow() + 1, 1, eventsToAdd.length, 5).setValues(eventsToAdd);
      }

      return response({ 
        status: 'success', 
        message: 'Bulk process complete', 
        added: addedCount, 
        duplicates: duplicateCount 
      });
    }

    else if (action === 'bulk_delete') {
      const idsToDelete = new Set(data.ids); // expects array of IDs
      if (idsToDelete.size === 0) return response({ status: 'success', message: 'No IDs to delete' });

      const rows = sheet.getDataRange().getValues();
      const header = rows.shift(); // keep header
      
      const keptRows = rows.filter(r => !idsToDelete.has(r[0]));
      
      if (keptRows.length < rows.length) {
          sheet.clearContents();
          sheet.appendRow(header);
          if (keptRows.length > 0) {
            sheet.getRange(2, 1, keptRows.length, keptRows[0].length).setValues(keptRows);
          }
      }
      return response({ status: 'success', message: 'Bulk delete complete', deleted: rows.length - keptRows.length });
    }

    else if (action === 'clear_all') {
      const rows = sheet.getDataRange().getValues();
      const header = rows[0] || ['id', 'start_date', 'end_date', 'title', 'category'];
      sheet.clearContents();
      sheet.appendRow(header);
      return response({ status: 'success', message: 'All draft events cleared' });
    }

    else if (action === 'update') {
      const rows = sheet.getDataRange().getValues();
      rows.shift();
      const rowIndex = rows.findIndex(r => r[0] === data.id);
      
      if (rowIndex === -1) {
        return response({ status: 'error', message: 'ID not found' });
      }
      
      const endDate = data.end || data.start;
      const range = sheet.getRange(rowIndex + 2, 1, 1, 5);
      range.setValues([[data.id, data.start, endDate, data.title, data.category]]);
      
      return response({ status: 'success', message: 'Event updated' });
    }
    
    else if (action === 'delete') {
      const rows = sheet.getDataRange().getValues();
      rows.shift();
      const rowIndex = rows.findIndex(r => r[0] === data.id);
      
      if (rowIndex === -1) {
        return response({ status: 'error', message: 'ID not found' });
      }
      
      sheet.deleteRow(rowIndex + 2);
      return response({ status: 'success', message: 'Event deleted' });
    }

    return response({ status: 'error', message: 'Invalid action' });

  } catch (error) {
    return response({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// --- GOOGLE CALENDAR HELPER FUNCTIONS ---
function handleGCalPost(data, targetGCalId) {
   const calId = targetGCalId || data.gcal_id || GCAL_ID;
   let cal = CalendarApp.getCalendarById(calId);
   if (!cal) {
      cal = CalendarApp.getDefaultCalendar();
   }
   if (!cal) return response({status: 'error', message: 'Calendar access failed or not found: ' + calId});

   try {
     if (data.action === 'create') {
        const start = new Date(data.start);
        const end = new Date(data.end || data.start);
        // GCal requires exclusive end date for all-day events (date + 1)
        end.setDate(end.getDate() + 1);
        
        const evt = cal.createAllDayEvent(data.title, start, end);
        // We can't set arbitrary ID, GCal generates it.
        return response({status: 'success', id: evt.getId()});
     } 
     else if (data.action === 'update') {
        const evt = cal.getEventById(data.id);
        if (!evt) return response({status:'error', message:'Event not found in GCal'});
        
        evt.setTitle(data.title);
        
        const start = new Date(data.start);
        const end = new Date(data.end || data.start);
        end.setDate(end.getDate() + 1);
        
        evt.setAllDayDates(start, end);
        return response({status: 'success'});
     }
     else if (data.action === 'delete') {
        const evt = cal.getEventById(data.id);
        if (evt) {
          evt.deleteEvent();
          return response({status: 'success'});
        }
        return response({status: 'error', message: 'Event not found'});
     }
     else if (data.action === 'bulk_delete') {
        const ids = data.ids; // array of IDs
        let deletedCount = 0;
        if (Array.isArray(ids)) {
           ids.forEach(id => {
              try {
                const evt = cal.getEventById(id);
                if (evt) { evt.deleteEvent(); deletedCount++; }
              } catch(e) {}
           });
        }
        return response({status: 'success', deleted: deletedCount});
     }
   } catch(e) {
     return response({status: 'error', message: 'GCal Error: ' + e.toString()});
   }
   return response({status: 'error', message: 'Invalid GCal Action'});
}

// --- READ (doGet) ---
function doGet(e) {
  try {
    const source = e.parameter.source;
    const targetGCalId = e.parameter.gcal_id || GCAL_ID;

    // --- GOOGLE CALENDAR FETCH ---
    if (source === 'gcal') {
       let cal = CalendarApp.getCalendarById(targetGCalId);
       if (!cal) {
          cal = CalendarApp.getDefaultCalendar();
       }
       
       if (!cal) {
          return response({ status: 'success', data: [], message: 'Calendar not found: ' + targetGCalId });
       }

       // 1. Get GCal Events
       const start = new Date(2026, 0, 1);
       const end = new Date(2026, 11, 31);
       const events = cal.getEvents(start, end);
       
       // 2. PREPARE DRAFT MAP FOR CATEGORY LOOKUP (MATCH BY DATE|TITLE)
       // This ensures "Public" tab shows same category as "Draft" if it exists there.
       const sheet = setupSheet();
       const rows = sheet.getDataRange().getValues();
       rows.shift(); // remove header
       
       const draftCategoryMap = {};
       rows.forEach(row => {
          const d = formatDate(row[1]);
          const t = String(row[3]).trim().toLowerCase();
          const cat = row[4];
          if(d && t) {
            draftCategoryMap[`${d}|${t}`] = cat;
          }
       });

       const mappedEvents = events.map(evt => {
          const title = evt.getTitle();
          let startDate = evt.getStartTime();
          let endDate = evt.getEndTime();
          const isAllDay = evt.isAllDayEvent();

          if (isAllDay) {
             endDate = new Date(endDate.getTime() - 1000); 
          }
          
          const startDateStr = formatDate(startDate);
          const titleLower = title.trim().toLowerCase();
          
          // TRY LOOKUP FIRST
          let category = draftCategoryMap[`${startDateStr}|${titleLower}`];

          // IF NOT FOUND, GUESS
          if (!category) {
              category = 'academic'; // default
              const lower = titleLower;
              
              if (lower.includes('cuti') || lower.includes('raya') || lower.includes('tahun baru') || lower.includes('deepavali') || lower.includes('krismas') || lower.includes('thaipusam')) category = 'holiday';
              else if (lower.includes('peperiksaan') || lower.includes('ujian') || lower.includes('spm') || lower.includes('pentaksiran') || lower.includes('pasa')) category = 'exam';
              else if (lower.includes('mesyuarat') || lower.includes('taklimat')) category = 'meeting';
              else if (lower.includes('sukan') || lower.includes('latihan') || lower.includes('koko') || lower.includes('1m1s') || lower.includes('krs')) category = 'koko';
              else if (lower.includes('hem') || lower.includes('asrama') || lower.includes('disiplin') || lower.includes('sahsiah')) category = 'hem';
              else if (lower.includes('program') || lower.includes('sambutan') || lower.includes('majlis') || lower.includes('gotong')) category = 'program';
          }

          return {
             id: evt.getId(),
             title: title,
             start: startDateStr,
             end: formatDate(endDate),
             category: category
          };
       });

       return response({ status: 'success', data: mappedEvents });
    }

    // --- SHEETS FETCH (DEFAULT) ---
    const sheet = setupSheet();
    let rows = sheet.getDataRange().getValues();
    
    // If sheet only has header or is empty, return empty list (do not auto-populate old seed data)
    if (rows.length <= 1) {
       return response({ status: 'success', data: [] });
    }
    
    const headers = rows.shift();
    
    const events = rows.map(row => ({
      id: row[0],
      start: formatDate(row[1]),
      end: formatDate(row[2]),
      title: row[3],
      category: row[4]
    })).filter(e => e.id && e.start);

    return response({ status: 'success', data: events });

  } catch (error) {
    return response({ status: 'error', message: error.toString() });
  }
}

function response(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatDate(dateObj) {
  if (!dateObj) return "";
  if (typeof dateObj === 'string') return dateObj.substring(0, 10);
  
  try {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return String(dateObj);
  }
}