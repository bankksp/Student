

/**
 * @description Google Apps Script backend for the School Admission System.
 */

// ***************************************************************
// *****              ADMIN CREDENTIAL SETUP                 *****
// ***************************************************************

function setupAdmin() {
  var properties = PropertiesService.getScriptProperties();
  var username = 'admin';
  var password = 'KalasinPanya2567'; // <-- CHANGE THIS PASSWORD!
  var hashedPassword = bytesToHex(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password));
  
  properties.setProperty('ADMIN_USERNAME', username);
  properties.setProperty('ADMIN_PASSWORD_HASH', hashedPassword);
  
  Logger.log('Admin user "' + username + '" has been set up successfully.');
}

function bytesToHex(bytes) {
  return bytes.map(function(byte) {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

// ***************************************************************
// *****              CONFIGURATION                          *****
// ***************************************************************
var ROOT_FOLDER_ID = "1T31G76rMzxnKPnn2ztkr2t-0CWtVR4QD"; 

var STUDENT_SHEET_NAME = "Students";
var NEWS_SHEET_NAME = "News";
var EVALUATION_SHEET_NAME = "Evaluations";
var SETTINGS_SHEET_NAME = "Settings";

var STUDENT_HEADERS = [
  'id', 'nationalId', 'prefix', 'firstName', 'lastName', 'nickname', 'birthDate',
  'ethnicity', 'nationality', 'religion', 'childOrder', 'siblingsCount', 'siblingsMale', 'siblingsFemale',
  'hasDisabilityId', 'disabilityId', 'disabilityType', 'disabilityDescription', 'medicalCondition', 'bloodType',
  'fatherPrefix', 'fatherFirstName', 'fatherLastName', 'fatherAge', 'fatherOccupation', 'fatherEducation', 'fatherNationalId', 'fatherIncome', 'fatherPhone',
  'motherPrefix', 'motherFirstName', 'motherLastName', 'motherAge', 'motherOccupation', 'motherEducation', 'motherNationalId', 'motherIncome', 'motherPhone',
  'isGuardianParent', 'guardianPrefix', 'guardianFirstName', 'guardianLastName', 'guardianAge', 'guardianOccupation', 'guardianEducation', 'guardianNationalId', 'guardianIncome', 'guardianPhone', 'guardianRelation',
  'maritalStatus',
  'addressHouseNumber', 'addressMoo', 'addressVillage', 'addressStreet', 'addressSubdistrict', 'addressDistrict', 'addressProvince', 'addressZipcode', 'addressPhone',
  'studentLivesWith', 'studentLivesWithRelation', 'studentLivesWithPhone',
  'previousSchool', 'gpa', 'hasStudiedBefore', 'reasonForNotStudying', 'previousEducationLevel', 'previousEducationYear',
  'applyLevel', 'program',
  'status', 'appliedDate', 'rejectionReason', 'adminNotes', 'phone',
  'fileStudentPhoto', 'fileStudentHouseReg', 'fileBirthCertificate', 'fileStudentIdCard', 'fileDisabilityCard', 'fileFatherIdCard', 'fileMotherIdCard', 'fileGuardianIdCard'
];
var NEWS_HEADERS = ['id', 'title', 'content', 'date', 'type', 'imageUrls', 'videoUrl', 'fileUrl', 'fileName'];
var EVALUATION_HEADERS = ['id', 'studentId', 'studentName', 'evaluatorName', 'evaluatorRole', 'evaluatorPosition', 'evaluationDate', 'section1', 'section2', 'section3'];
var SETTINGS_HEADERS = ['isOpen', 'startDate', 'endDate', 'academicYear', 'announcementText'];

function ensureSheetAndHeaders(ss, sheetName, headers) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (sheet.getLastRow() === 0 && headers && headers.length > 0) {
    sheet.appendRow(headers);
  }
  return sheet;
}

function getSheetData(sheet) {
    if (!sheet || sheet.getLastRow() <= 1) return [];
    var data = sheet.getDataRange().getValues();
    var headers = data.shift();
    var jsonData = data.map(function(row) {
      var obj = {};
      headers.forEach(function(header, i) {
        var value = row[i];
        
        if (header === 'imageUrls') {
          obj[header] = (value && typeof value === 'string') ? value.split(',').filter(String) : [];
          return;
        }

        var lowerHeader = header.toLowerCase();
        var forceString = lowerHeader.indexOf('id') !== -1 ||
                          lowerHeader.indexOf('phone') !== -1 ||
                          lowerHeader.indexOf('zipcode') !== -1;
        
        if (forceString) {
          obj[header] = (value !== null && value !== undefined) ? String(value) : '';
        } else if (value instanceof Date) {
          obj[header] = value;
        } else if (value === 'TRUE' || value === true) {
          obj[header] = true;
        } else if (value === 'FALSE' || value === false) {
          obj[header] = false;
        } else if (value !== null && value !== undefined && !isNaN(value) && String(value).trim() !== '' && !/^\d{4}-\d{2}-\d{2}/.test(String(value))) {
          obj[header] = Number(value);
        } else {
          obj[header] = value;
        }
      });
      return obj;
    });
    return jsonData;
}

function getSettings(ss) {
  var sheet = ensureSheetAndHeaders(ss, SETTINGS_SHEET_NAME, SETTINGS_HEADERS);
  var data = getSheetData(sheet);
  if (data.length > 0) {
    return data[0];
  }
  return null;
}

function doGet(e) {
  try {
    var sheetId = e.parameter.sheetId;
    if (!sheetId) throw new Error("Sheet ID is required.");
    var ss = SpreadsheetApp.openById(sheetId);
    
    var allData = {
      students: getSheetData(ss.getSheetByName(STUDENT_SHEET_NAME)),
      news: getSheetData(ss.getSheetByName(NEWS_SHEET_NAME)),
      evaluations: getSheetData(ss.getSheetByName(EVALUATION_SHEET_NAME)),
      settings: getSettings(ss)
    };

    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: allData })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(30000)) throw new Error("System busy.");
    
    // 1. Determine parameters (JSON body vs query parameters)
    var params = e.parameter; // Default to query parameters
    if (e.postData && e.postData.contents) {
       try {
         // Attempt to parse JSON body
         var jsonParams = JSON.parse(e.postData.contents);
         // Merge JSON params into params (JSON takes precedence)
         for (var key in jsonParams) {
           params[key] = jsonParams[key];
         }
       } catch(err) {
         // Content might not be JSON, just ignore and use default params
       }
    }

    var action = params.action;
    var sheetId = params.sheetId;

    if (action === 'login') return handleLogin(params);
    
    if (!sheetId) throw new Error("Sheet ID is required.");
    var ss = SpreadsheetApp.openById(sheetId);

    var result;
    switch(action) {
      case "addStudent": result = handleAddStudent(params, ss); break;
      case "updateStudent": result = handleUpdateStudent(params, ss.getSheetByName(STUDENT_SHEET_NAME)); break;
      case "deleteStudent": result = handleDeleteStudent(params, ss.getSheetByName(STUDENT_SHEET_NAME)); break;
      case "updateStudentStatus": result = handleUpdateStudentStatus(params, ss.getSheetByName(STUDENT_SHEET_NAME)); break;
      case "addNews": result = handleAddNews(params, ss); break;
      case "updateNews": result = handleUpdateNews(params, ss.getSheetByName(NEWS_SHEET_NAME)); break;
      case "deleteNews": result = handleDeleteNews(params, ss.getSheetByName(NEWS_SHEET_NAME)); break;
      case "addEvaluation": result = handleAddEvaluation(params, ss); break;
      case "updateEvaluation": result = handleUpdateEvaluation(params, ss.getSheetByName(EVALUATION_SHEET_NAME)); break;
      case "updateSettings": result = handleUpdateSettings(params, ss); break;
      default: throw new Error("Invalid action: " + action);
    }
    return result;
  } catch (error) {
    Logger.log("doPost Error: " + error.toString() + " Stack: " + error.stack);
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function handleLogin(params) {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty('ADMIN_USERNAME')) {
      return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "ยังไม่ได้ตั้งค่าผู้ใช้แอดมิน กรุณาเรียกใช้ฟังก์ชัน setupAdmin() ในตัวแก้ไขสคริปต์" })).setMimeType(ContentService.MimeType.JSON);
  }
  if (params.username === props.getProperty('ADMIN_USERNAME') && 
      params.hashedPassword === props.getProperty('ADMIN_PASSWORD_HASH')) {
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Invalid credentials" })).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================================
// ==================== FILE HANDLING =======================
// ==========================================================

function getUploadFolder(subFolderName) {
  var rootFolder;
  if (ROOT_FOLDER_ID && ROOT_FOLDER_ID.trim() !== "") {
    try {
      rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    } catch (e) {
      var fallbackFolderName = "KalasinPanya_StudentApplications_Fallback";
      var fallbackFolders = DriveApp.getFoldersByName(fallbackFolderName);
      rootFolder = fallbackFolders.hasNext() ? fallbackFolders.next() : DriveApp.createFolder(fallbackFolderName);
    }
  } else {
    var defaultFolderName = "KalasinPanya_StudentApplications";
    var defaultFolders = DriveApp.getFoldersByName(defaultFolderName);
    rootFolder = defaultFolders.hasNext() ? defaultFolders.next() : DriveApp.createFolder(defaultFolderName);
  }
  
  if (subFolderName) {
    var sanitizedName = String(subFolderName).replace(/[^a-zA-Z0-9-_\.]/g, '_');
    var subFolders = rootFolder.getFoldersByName(sanitizedName);
    return subFolders.hasNext() ? subFolders.next() : rootFolder.createFolder(sanitizedName);
  }
  return rootFolder;
}

function uploadFile(fileBlob, subFolderName) {
    var folder = getUploadFolder(subFolderName);
    var newFile = folder.createFile(fileBlob);
    
    try {
      newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      Logger.log("Error setting sharing permissions: " + e.message);
    }
    
    var fileId = newFile.getId();
    var mimeType = fileBlob.getContentType();
    
    // For images, use a direct content link which is more robust for embedding
    if (mimeType && mimeType.indexOf('image/') === 0) {
        return 'https://lh3.googleusercontent.com/d/' + fileId;
    }
    
    // For other files, use the view link
    return 'https://drive.google.com/uc?export=view&id=' + fileId;
}

function getBlobFromDataUrl(dataUrl, filename) {
  var parts = dataUrl.split(',');
  var match = parts[0].match(/:(.*?);/);
  var mimeType = match ? match[1] : 'application/octet-stream';
  var data = parts[1];
  var decoded = Utilities.base64Decode(data);
  return Utilities.newBlob(decoded, mimeType, filename);
}

function processFileField(value, filename, subFolderName) {
  // Check if value is a Base64 Data URI
  if (typeof value === 'string' && value.match(/^data:[^;]+;base64,/)) {
     try {
       var blob = getBlobFromDataUrl(value, filename || 'file');
       return uploadFile(blob, subFolderName);
     } catch (e) {
       Logger.log("Error processing file field: " + e.message);
       return "UPLOAD_ERROR";
     }
  }
  // If not a base64 string, return it as is (could be existing URL or empty)
  return value;
}

function findColumnIndex(headers, colName) {
  return headers.findIndex(function(h) { return String(h).trim().toLowerCase() === String(colName).toLowerCase(); });
}

function findRowIndexById(data, idIdx, idValue) {
  return data.slice(1).findIndex(function(row) { return String(row[idIdx]).trim() === String(idValue).trim(); });
}


// ==========================================================
// ==================== STUDENT ACTIONS =====================
// ==========================================================
function handleAddStudent(params, ss) {
  var sheet = ensureSheetAndHeaders(ss, STUDENT_SHEET_NAME, STUDENT_HEADERS);
  var newRowObject = {};
  var studentIdentifier = params.nationalId || ("new_applicant_" + new Date().getTime());

  STUDENT_HEADERS.forEach(function(header) {
    var value = params[header];
    
    // Check if it's a file header
    if (header.startsWith('file') && value) {
        newRowObject[header] = processFileField(value, params[header + '_name'], studentIdentifier);
    } else {
        newRowObject[header] = value !== undefined ? value : "";
    }
  });

  // System fields
  newRowObject.id = "sid_" + new Date().getTime() + Math.random().toString(36).substring(2, 8);
  newRowObject.status = "pending";
  newRowObject.appliedDate = new Date().toISOString();
  
  var rowData = STUDENT_HEADERS.map(function(header) { return newRowObject[header] !== undefined ? newRowObject[header] : ""; });
  sheet.appendRow(rowData);
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Student added." })).setMimeType(ContentService.MimeType.JSON);
}


function handleUpdateStudent(params, sheet) {
  var studentId = params.id;
  if (!studentId) throw new Error("Student ID missing.");
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) throw new Error("Student list is empty.");

  var headers = data[0];
  var idIdx = findColumnIndex(headers, 'id');
  var rowIdx = findRowIndexById(data, idIdx, studentId);
  if (rowIdx === -1) throw new Error("Student not found.");
  
  var row = rowIdx + 2;
  var studentIdentifier = params.nationalId || studentId;

  headers.forEach(function(header, col) {
      if (header === 'id') return; // Don't update ID
      
      var value = params[header];
      if (value !== undefined) {
         if (header.startsWith('file')) {
             // Only update file if a new file (base64) is provided, otherwise keep old
             if (value && value.match(/^data:/)) {
                var fileUrl = processFileField(value, params[header + '_name'], studentIdentifier);
                sheet.getRange(row, col + 1).setValue(fileUrl);
             }
         } else {
             sheet.getRange(row, col + 1).setValue(value);
         }
      }
  });
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
}

function handleUpdateStudentStatus(params, sheet) {
  var studentId = params.id;
  var newStatus = params.status;
  var reason = params.rejectionReason;

  if (!studentId || !newStatus) {
    throw new Error("Student ID and new status are required.");
  }

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIdx = findColumnIndex(headers, 'id');
  var rowIdx = findRowIndexById(data, idIdx, studentId);

  if (rowIdx === -1) {
    throw new Error("Student not found.");
  }
  
  var statusIdx = findColumnIndex(headers, 'status');
  var reasonIdx = findColumnIndex(headers, 'rejectionReason');
  var row = rowIdx + 2; // +1 for header, +1 for 0-based index

  if (statusIdx === -1 || reasonIdx === -1) {
    throw new Error("Could not find 'status' or 'rejectionReason' columns.");
  }

  sheet.getRange(row, statusIdx + 1).setValue(newStatus);
  
  if (newStatus === 'rejected') {
    sheet.getRange(row, reasonIdx + 1).setValue(reason || '');
  } else if (newStatus === 'approved') {
    // Clear the reason if approved
    sheet.getRange(row, reasonIdx + 1).setValue('');
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Status updated." })).setMimeType(ContentService.MimeType.JSON);
}

function handleDeleteStudent(params, sheet) {
    var studentId = params.id;
    if (!studentId) throw new Error("Student ID is required.");
    
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIdx = findColumnIndex(headers, 'id');
    var rowIdx = findRowIndexById(data, idIdx, studentId);
    
    if (rowIdx === -1) throw new Error("Student not found.");
    sheet.deleteRow(rowIdx + 2);

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Student deleted." })).setMimeType(ContentService.MimeType.JSON);
}


// ==========================================================
// ====================== NEWS ACTIONS ======================
// ==========================================================
function handleAddNews(params, ss) {
  var sheet = ensureSheetAndHeaders(ss, NEWS_SHEET_NAME, NEWS_HEADERS);
  var newRowObject = {};
  var newsSubFolder = "News_" + (params.title || new Date().getTime());
  var imageUrls = [];
  
  // Handle new images array
  if (params.newImages && Array.isArray(params.newImages)) {
      params.newImages.forEach(function(imgObj) {
          if (imgObj.data) {
             try {
                imageUrls.push(processFileField(imgObj.data, imgObj.name, newsSubFolder));
             } catch(e) { Logger.log("Img upload err: " + e.message); }
          }
      });
  }
  
  NEWS_HEADERS.forEach(function(h) {
      if (params[h] !== undefined) newRowObject[h] = params[h];
  });
  
  // Handle attachment
  if (params.attachmentFile) {
     newRowObject.fileUrl = processFileField(params.attachmentFile, params.attachmentFileName, newsSubFolder);
     newRowObject.fileName = params.attachmentFileName || newRowObject.fileName;
  }
  
  newRowObject.imageUrls = imageUrls.join(',');
  newRowObject.id = "nid_" + new Date().getTime();
  newRowObject.date = params.date || new Date().toISOString();

  var rowData = NEWS_HEADERS.map(function(header) { return newRowObject[header] !== undefined ? newRowObject[header] : ""; });
  sheet.appendRow(rowData);

  return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "News added." })).setMimeType(ContentService.MimeType.JSON);
}

function handleUpdateNews(params, sheet) {
  var newsId = params.id;
  if (!newsId) throw new Error("News ID missing.");

  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIdx = findColumnIndex(headers, 'id');
  var rowIdx = findRowIndexById(data, idIdx, newsId);
  if (rowIdx === -1) throw new Error("News not found.");
  
  var row = rowIdx + 2;
  var newsSubFolder = "News_" + (params.title || newsId);
  
  // Start with existing URLs if provided
  var currentUrls = params.imageUrls ? String(params.imageUrls).split(',').filter(String) : [];
  
  // Add new images
  if (params.newImages && Array.isArray(params.newImages)) {
      params.newImages.forEach(function(imgObj) {
          if (imgObj.data) {
             try {
                currentUrls.push(processFileField(imgObj.data, imgObj.name, newsSubFolder));
             } catch(e) {}
          }
      });
  }

  // Update attachment
  var newFileUrl = null;
  if (params.attachmentFile) {
     newFileUrl = processFileField(params.attachmentFile, params.attachmentFileName, newsSubFolder);
  }

  headers.forEach(function(header, col) {
      if (header === 'id') return;
      
      if (header === 'imageUrls') {
          sheet.getRange(row, col + 1).setValue(currentUrls.join(','));
      } else if (header === 'fileUrl') {
          if (newFileUrl) {
             sheet.getRange(row, col + 1).setValue(newFileUrl);
          } else if (params.fileUrl === '') {
             // Explicit clear
             sheet.getRange(row, col + 1).setValue(''); 
          }
      } else if (header === 'fileName') {
           if (params.attachmentFileName) {
               sheet.getRange(row, col + 1).setValue(params.attachmentFileName);
           } else if (params.fileName === '') {
               sheet.getRange(row, col + 1).setValue('');
           }
      } else if (params[header] !== undefined) {
          sheet.getRange(row, col + 1).setValue(params[header]);
      }
  });

  return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
}


function handleDeleteNews(params, sheet) {
  var newsId = params.id;
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIdx = findColumnIndex(headers, 'id');
  var rowIdx = findRowIndexById(data, idIdx, newsId);
  
  if (rowIdx === -1) throw new Error("News not found.");
  sheet.deleteRow(rowIdx + 2);
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================================
// ================== EVALUATION ACTIONS ====================
// ==========================================================
function handleAddEvaluation(params, ss) {
  var sheet = ensureSheetAndHeaders(ss, EVALUATION_SHEET_NAME, EVALUATION_HEADERS);
  var newRowObject = {};
  EVALUATION_HEADERS.forEach(function(header) { if (params[header] !== undefined) newRowObject[header] = params[header]; });
  newRowObject.id = params.studentId + "-" + params.evaluatorRole + "-" + new Date().getTime();
  sheet.appendRow(EVALUATION_HEADERS.map(h => newRowObject[h] || ""));
  return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
}

function handleUpdateEvaluation(params, sheet) {
  var evalId = params.id;
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var idIdx = findColumnIndex(headers, 'id');
  var rowIdx = findRowIndexById(data, idIdx, evalId);
  
  if (rowIdx === -1) return handleAddEvaluation(params, SpreadsheetApp.openById(sheet.getParent().getId()));
  
  var row = rowIdx + 2;
  headers.forEach(function(header, col) { 
      if (header !== 'id' && params[header] !== undefined) {
          sheet.getRange(row, col + 1).setValue(params[header]);
      }
  });
  return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================================
// ================== SETTINGS ACTIONS ======================
// ==========================================================
function handleUpdateSettings(params, ss) {
  var sheet = ensureSheetAndHeaders(ss, SETTINGS_SHEET_NAME, SETTINGS_HEADERS);
  var rowData = SETTINGS_HEADERS.map(function(header) { return params[header] !== undefined ? params[header] : ""; });
  
  // Ensure we are writing to the second row (first row is header)
  // setValues requires a 2D array
  sheet.getRange(2, 1, 1, rowData.length).setValues([rowData]);
  
  return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
}