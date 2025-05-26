(function() {

// Created the favicon on https://favicon.io/favicon-generator/
let faviconLink = document.createElement('link');
faviconLink.href = 'images/favicon.ico';
faviconLink.rel = 'icon';
faviconLink.type = 'image/x-icon';
document.head.appendChild(faviconLink);

const drag1 = document.getElementById('drag1');
const drag2 = document.getElementById('drag2');
const filename1 = document.getElementById('filename1');
const filename2 = document.getElementById('filename2');
const fileinput1 = document.getElementById('fileinput1');
const fileinput2 = document.getElementById('fileinput2');
const compare = document.getElementById('compare');
const message = document.getElementById('message');
// const terminal = document.getElementById('terminal');

let files1, files2;

const focusTerminalWOScrolling = function() {
  if (typeof terminal !== 'undefined') {
    terminal.focus({preventScroll: true});
  }
};

window.addEventListener('load', function(e){
  focusTerminalWOScrolling();
});

drag1.addEventListener('dragover', function(e){
  e.preventDefault();
});

drag2.addEventListener('dragover', function(e){
  e.preventDefault();
});

drag1.addEventListener('drop', function(e){
  e.preventDefault();
  files1 = e.dataTransfer.files;
  filename1.classList.remove('top40');
  filename1.innerHTML = Array.from(files1).map(file => file.name).join('<br>');
  toggleCompareButton();
});

drag2.addEventListener('drop', function(e){
  e.preventDefault();
  files2 = e.dataTransfer.files;
  filename2.classList.remove('top40');
  filename2.innerHTML = Array.from(files2).map(file => file.name).join('<br>');
  toggleCompareButton();
});

drag1.addEventListener('click', function(e){
  fileinput1.click();
});

drag2.addEventListener('click', function(e){
  fileinput2.click();
});

fileinput1.addEventListener('change', function(e){
  files1 = e.target.files;
  filename1.classList.remove('top40');
  filename1.innerHTML = Array.from(files1).map(file => file.name).join('<br>');
  toggleCompareButton();
});

fileinput2.addEventListener('change', function(e){
  files2 = e.target.files;
  filename2.classList.remove('top40');
  filename2.innerHTML = Array.from(files2).map(file => file.name).join('<br>');
  toggleCompareButton();
});

const toggleCompareButton = function() {
  if (files1 && files2) {
    compare.style.opacity = 0.9;
  } else {
    compare.style.opacity = 0.4;
  }
};

compare.addEventListener('mousedown', function(e){
  if (!(files1 && files2)) return;
  compare.style.backgroundColor = '#008000';
});

for (let e of ['mouseleave', 'mouseup']) {
  compare.addEventListener(e, function(e){
    compare.style.backgroundColor = '';
  });
}

compare.addEventListener('click', async function(e){
  if (hasError()) return;
  let readers1 = [];
  let readers2 = [];
  
  // 创建 Promise 数组来处理所有文件读取
  const readPromises = [];
  
  for (let i = 0; i < files1.length; i++) {
    const reader1 = new FileReader();
    const reader2 = new FileReader();
    readers1.push(reader1);
    readers2.push(reader2);

    // 创建读取 Promise
    const promise1 = new Promise((resolve, reject) => {
      reader1.onload = () => resolve();
      reader1.onerror = reject;
    });
    
    const promise2 = new Promise((resolve, reject) => {
      reader2.onload = () => resolve();
      reader2.onerror = reject;
    });

    readPromises.push(promise1, promise2);

    // 根据文件类型选择读取方式
    const fileType = getFileType(files1[i].name);
    if (fileType === 'docx' || fileType === 'xlsx') {
      reader1.readAsArrayBuffer(files1[i]);
      reader2.readAsArrayBuffer(files2[i]);
    } else {
      reader1.readAsText(files1[i]);
      reader2.readAsText(files2[i]);
    }
  }
  
  // 等待所有文件读取完成
  try {
    await Promise.all(readPromises);
    await compareContents(readers1, readers2);
  } catch (error) {
    console.error('Error reading files:', error);
    displayError('Error reading files: ' + error.message);
  }
});

const getFileType = function(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (['xlf', 'txlf', 'xliff', 'sdlxliff', 'mqxliff', 'mxliff'].includes(ext)) return 'xlf';
  if (ext === 'tmx') return 'tmx';
  if (ext === 'txt') return 'txt';
  if (ext === 'docx') return 'docx';
  if (ext === 'xlsx') return 'xlsx';
  return 'unknown';
};

const hasError = function() {
  if (
    (!files1 || !files2) ||
    (files1.length != files2.length)
  ) {
    displayError('Error with files');
    return true;
  }
  
  // 检查支持的文件类型
  const supportedTypes = ['xlf', 'txlf', 'xliff', 'sdlxliff', 'mqxliff', 'mxliff', 'tmx', 'txt', 'docx', 'xlsx'];
  if (!Array.from(files1).every(file => supportedTypes.includes(getFileType(file.name))) ||
      !Array.from(files2).every(file => supportedTypes.includes(getFileType(file.name)))) {
    displayError('Unsupported file type');
    return true;
  }
  
  // 检查文件类型是否匹配
  const type1 = getFileType(files1[0].name);
  const type2 = getFileType(files2[0].name);
  
  if (type1 !== type2) {
    displayError('File types must match');
    return true;
  }
  
  return false;
};

const displayError = function(errorMessage) {
  message.textContent = errorMessage;
  setTimeout(function(){
    message.textContent = '';
  }, 5000);
};

const compareContents = async function(readers1, readers2) {
  let contents1 = {};
  let contents2 = {};
  let results = {};
  
  const fileType = getFileType(files1[0].name);
  
  // 处理文件2
  for (let reader2 of readers2) {
    let [original, transId, source, target, percent, noteArrays] = await parseFileContent(reader2.result, fileType, 2);
    while (contents2.hasOwnProperty(original)) original = original + '_';
    contents2[original] = {target: target, note: noteArrays};
  }
  
  // 处理文件1
  for (let reader1 of readers1) {
    let [original, transId, source, target, percent, noteArrays] = await parseFileContent(reader1.result, fileType, 1);
    while (contents1.hasOwnProperty(original)) original = original + '_';
    contents1[original] = {source: source, target: target, note: noteArrays};

    if (readers1.length == 1 && readers2.length == 1) {
      let onlyOriginal2 = Object.keys(contents2)[0];
      if (onlyOriginal2 != original) {
        contents2[original] = contents2[onlyOriginal2];
        delete contents2[onlyOriginal2];
      }
    }
    if (contents2.hasOwnProperty(original)) {
      results[original] = [];
      for (let i = 0; i < contents1[original].target.length; i++) {
        let shortSource = contents1[original].source[i] ? tagToPlaceholder(contents1[original].source[i]) : '';
        let stringArray1 = contents1[original].target[i] ? tagAndWordAsOneChar(contents1[original].target[i]) : [];
        let stringArray2 = (contents2[original].target.hasOwnProperty(i) && contents2[original].target[i]) ? tagAndWordAsOneChar(contents2[original].target[i]) : [];
        let [dpTable, distance] = diffDP(stringArray1, stringArray2);
        let [diffString1, diffString2] = diffSES(dpTable, stringArray1, stringArray2);
        let combinedNote = combineNote(contents1[original].note[i], contents2[original].note[i]);
        results[original].push([transId[i], shortSource, diffString1, diffString2, percent[i], combinedNote, distance]);
      }
    }
  }
  if (!Object.keys(results).length) {
    displayError('No matching files');
  } else {
    displayResults(results);
  }
};

const parseFileContent = async function(content, fileType, fileIndex) {
  switch (fileType) {
    case 'xlf':
      return parseXliff(content, fileIndex);
    case 'tmx':
      return parseTmx(content, fileIndex);
    case 'txt':
      return parseTxt(content, fileIndex);
    case 'docx':
      return await parseDocx(content, fileIndex);
    case 'xlsx':
      return parseXlsx(content, fileIndex);
    default:
      return ['unknown', [], [], [], [], []];
  }
};

const parseXliff = function(content) {
  const original = /<file [^>]*?original="([^"]+?)"/.exec(content)[1];
  let parsedTransId = [];
  let parsedSource = [];
  let parsedTarget = [];
  let parsedPercent = [];
  let parsedNoteArrays = [];
  const trimmedContent = content.replace(/<mq:historical-unit[^]+?<\/mq:historical-unit>/g, '').replace(/<alt-trans[^]+?<\/alt-trans>/g, '');
  const regexTransUnit = new RegExp('<trans-unit[^>]*? id="([^"]+?)"([^>]*?)>([^]+?)</trans-unit>', 'g');
  const regexPercent = new RegExp('(mq:percent|xmatch)="(\\d+)"');
  const regexSource = new RegExp('<source[^>]*?>([^]*?)</source>');
  const regexTarget = new RegExp('<target[^>]*?>([^]*?)</target>');
  const regexComment = new RegExp('(<mq:comment[^>]*?deleted="false"[^>]*?>([^]*?)</mq:comment>|<note>([^]*?)</note>)', 'g');
  let match, noteMatch;
  while (match = regexTransUnit.exec(trimmedContent)) {
    let transId = match[1];
    let matchPercent = regexPercent.exec(match[2]);
    let sourceMatch = regexSource.exec(match[3]);
    let targetMatch = regexTarget.exec(match[3]);
    let notes = [];
    while (noteMatch = regexComment.exec(match[3])) {
      notes.push(noteMatch[2] || noteMatch[3] || '');
    }
    parsedTransId.push(transId);
    parsedSource.push(sourceMatch? sourceMatch[1]: '');
    parsedTarget.push(targetMatch? targetMatch[1]: '');
    parsedPercent.push(matchPercent? matchPercent[2]: 0);
    parsedNoteArrays.push(notes);
  }
  return [original, parsedTransId, parsedSource, parsedTarget, parsedPercent, parsedNoteArrays];
};

const parseTmx = function(content) {
  const original = 'TMX_File';
  let parsedTransId = [];
  let parsedSource = [];
  let parsedTarget = [];
  let parsedPercent = [];
  let parsedNoteArrays = [];
  
  const regexTu = new RegExp('<tu[^>]*?(?:tuid="([^"]*?)")?[^>]*?>(.*?)</tu>', 'gs');
  const regexTuv = new RegExp('<tuv[^>]*?xml:lang="([^"]*?)"[^>]*?>(.*?)</tuv>', 'gs');
  const regexSeg = new RegExp('<seg[^>]*?>(.*?)</seg>', 's');
  const regexNote = new RegExp('<note[^>]*?>(.*?)</note>', 'gs');
  
  let tuMatch;
  let tuIndex = 0;
  
  while (tuMatch = regexTu.exec(content)) {
    let tuid = tuMatch[1] || `tu_${tuIndex++}`;
    let tuContent = tuMatch[2];
    
    let notes = [];
    let noteMatch;
    while (noteMatch = regexNote.exec(tuContent)) {
      notes.push(noteMatch[1].trim());
    }
    
    let tuvs = {};
    let tuvMatch;
    while (tuvMatch = regexTuv.exec(tuContent)) {
      let lang = tuvMatch[1];
      let tuvContent = tuvMatch[2];
      let segMatch = regexSeg.exec(tuvContent);
      if (segMatch) {
        tuvs[lang] = segMatch[1];
      }
    }
    
    let languages = Object.keys(tuvs);
    if (languages.length >= 2) {
      let sourceLang = languages[0];
      let targetLang = languages[1];
      
      parsedTransId.push(tuid);
      parsedSource.push(tuvs[sourceLang] || '');
      parsedTarget.push(tuvs[targetLang] || '');
      parsedPercent.push(0);
      parsedNoteArrays.push(notes);
    } else if (languages.length === 1) {
      parsedTransId.push(tuid);
      parsedSource.push(tuvs[languages[0]] || '');
      parsedTarget.push('');
      parsedPercent.push(0);
      parsedNoteArrays.push(notes);
    }
  }
  
  return [original, parsedTransId, parsedSource, parsedTarget, parsedPercent, parsedNoteArrays];
};

const parseTxt = function(content, fileIndex) {
  const original = `TXT_File_${fileIndex}`;
  const lines = content.split(/\r?\n/);
  let parsedTransId = [];
  let parsedSource = [];
  let parsedTarget = [];
  let parsedPercent = [];
  let parsedNoteArrays = [];
  
  lines.forEach((line, index) => {
    if (line.trim()) { // 跳过空行
      parsedTransId.push(`line_${index + 1}`);
      parsedSource.push(line);
      parsedTarget.push(line); // TXT文件源和目标相同
      parsedPercent.push(0);
      parsedNoteArrays.push([]);
    }
  });
  
  return [original, parsedTransId, parsedSource, parsedTarget, parsedPercent, parsedNoteArrays];
};

const parseDocx = async function(arrayBuffer, fileIndex) {
  const original = `DOCX_File_${fileIndex}`;
  let parsedTransId = [];
  let parsedSource = [];
  let parsedTarget = [];
  let parsedPercent = [];
  let parsedNoteArrays = [];
  
  try {
    // 使用 mammoth 解析 DOCX 文件
    const result = await mammoth.extractRawText({arrayBuffer: arrayBuffer});
    const text = result.value;
    
    if (text && text.trim()) {
      // 按段落分割文本（通过双换行符或单换行符）
      const paragraphs = text.split(/\n+/).filter(p => p.trim());
      
      if (paragraphs.length > 1) {
        // 如果有多个段落，分别处理每个段落
        paragraphs.forEach((paragraph, index) => {
          if (paragraph.trim()) {
            parsedTransId.push(`para_${index + 1}`);
            parsedSource.push(paragraph.trim());
            parsedTarget.push(paragraph.trim());
            parsedPercent.push(0);
            parsedNoteArrays.push([]);
          }
        });
      } else {
        // 如果只有一个段落或没有明显的段落分割，作为整体处理
        parsedTransId.push('doc_content');
        parsedSource.push(text.trim());
        parsedTarget.push(text.trim());
        parsedPercent.push(0);
        parsedNoteArrays.push([]);
      }
    } else {
      // 空文档
      parsedTransId.push('doc_content');
      parsedSource.push('Empty DOCX document');
      parsedTarget.push('Empty DOCX document');
      parsedPercent.push(0);
      parsedNoteArrays.push([]);
    }
    
    // 如果有警告信息，可以添加到注释中
    if (result.messages && result.messages.length > 0) {
      const warnings = result.messages.map(msg => msg.message).join('; ');
      console.log('DOCX parsing warnings:', warnings);
    }
    
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    parsedTransId.push('doc_error');
    parsedSource.push('Error parsing DOCX file: ' + error.message);
    parsedTarget.push('Error parsing DOCX file: ' + error.message);
    parsedPercent.push(0);
    parsedNoteArrays.push([]);
  }
  
  return [original, parsedTransId, parsedSource, parsedTarget, parsedPercent, parsedNoteArrays];
};

const parseXlsx = function(arrayBuffer, fileIndex) {
  const original = `XLSX_File_${fileIndex}`;
  let parsedTransId = [];
  let parsedSource = [];
  let parsedTarget = [];
  let parsedPercent = [];
  let parsedNoteArrays = [];
  
  try {
    // 使用XLSX库解析Excel文件
    const workbook = XLSX.read(arrayBuffer, {type: 'array'});
    
    // 获取第一个工作表
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // 将工作表转换为JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1, defval: ''});
    
    if (jsonData.length > 0) {
      jsonData.forEach((row, rowIndex) => {
        if (row.length > 0) {
          // 合并行中的所有非空单元格
          const rowText = row.filter(cell => cell && cell.toString().trim()).join(' ');
          if (rowText.trim()) {
            parsedTransId.push(`row_${rowIndex + 1}`);
            parsedSource.push(rowText);
            parsedTarget.push(rowText);
            parsedPercent.push(0);
            parsedNoteArrays.push([]);
          }
        }
      });
    }
    
    if (parsedTransId.length === 0) {
      parsedTransId.push('xlsx_content');
      parsedSource.push('Empty XLSX file');
      parsedTarget.push('Empty XLSX file');
      parsedPercent.push(0);
      parsedNoteArrays.push([]);
    }
  } catch (error) {
    console.error('Error parsing XLSX:', error);
    parsedTransId.push('xlsx_error');
    parsedSource.push('Error parsing XLSX file: ' + error.message);
    parsedTarget.push('Error parsing XLSX file: ' + error.message);
    parsedPercent.push(0);
    parsedNoteArrays.push([]);
  }
  
  return [original, parsedTransId, parsedSource, parsedTarget, parsedPercent, parsedNoteArrays];
};

const convertXMLEntities = function(string) {
  return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

const tagAndWordAsOneChar = function(string) {
  let stringArray = [];
  let match;
  while (match = /(<ph[^>]*?>.*?<\/ph[^>]*?>|<bpt[^>]*?>.*?<\/bpt[^>]*?>|<ept[^>]*?>.*?<\/ept[^>]*?>|<it[^>]*?>.*?<\/it[^>]*?>|&lt;.*?&gt;)/g.exec(string)) {
    stringArray.push(...string.substring(0, match.index).split(''));
    stringArray.push(`<span class="tag" title="${match[0].startsWith('<ph') || match[0].startsWith('<bpt') || match[0].startsWith('<ept') || match[0].startsWith('<it')? convertXMLEntities(match[0]): match[0]}">⬣</span>`);
    string = string.substring(match.index + match[0].length);
  }
  stringArray.push(...string.split(/((?<=[^A-Za-zÀ-ȕ])|(?=[^A-Za-zÀ-ȕ]))/g).filter(string => string.length >= 1));
  return stringArray;
};

const tagToPlaceholder = function(string) {
  return string.replace(/(<ph[^>]*?>.*?<\/ph[^>]*?>|<bpt[^>]*?>.*?<\/bpt[^>]*?>|<ept[^>]*?>.*?<\/ept[^>]*?>|<it[^>]*?>.*?<\/it[^>]*?>|&lt;.*?&gt;)/g, $0 => `<span class="tag" title="${$0.startsWith('<ph') || $0.startsWith('<bpt') || $0.startsWith('<ept') || $0.startsWith('<it')? convertXMLEntities($0): $0}">⬣</span>`);
};

const combineNote = function(noteArray1, noteArray2) {
  if (noteArray2 == undefined) return [...new Set(noteArray1.map(note => `(1) ${note}\n`))];
  let combinedNoteArray = [];
  for (let i = 0; i < noteArray1.length; i++) {
    let index2 = noteArray2.indexOf(noteArray1[i]);
    if (index2 > -1) {
      delete noteArray2[index2];
      if (noteArray1[i]) combinedNoteArray.push(`(1&2) ${noteArray1[i]}\n`);
    } else {
      if (noteArray1[i]) combinedNoteArray.push(`(1) ${noteArray1[i]}\n`);
    }
  }
  for (let i = 0; i < noteArray2.length; i++) {
    if (noteArray2[i]) combinedNoteArray.push(`(2) ${noteArray2[i]}\n`);
  }
  return [...new Set(combinedNoteArray)].join('\n');
};

const diffDP = function(stringArray1, stringArray2) {
  const length1 = stringArray1.length;
  const length2 = stringArray2.length;
  if (length1 == 0) stringArray1 = [''];
  if (length2 == 0) stringArray2 = [''];
  const dpTable = new Array(length1 + 1).fill(0).map(row => new Array(length2 + 1).fill(0));
  for (let i = 0; i <= length1; i++) dpTable[i][0] = i;
  for (let j = 0; j <= length2; j++) dpTable[0][j] = j;
  for (let i = 0; i < length1; i++) {
    for (let j = 0; j < length2; j++) {
      dpTable[i + 1][j + 1] = Math.min(
        dpTable[i][j + 1] + 1,
        dpTable[i + 1][j] + 1,
        dpTable[i][j] + 1 * (stringArray1[i] != stringArray2[j])
      );
    }
  }
  return [dpTable, dpTable[length1][length2]];
};

const diffSES = function(dpTable, stringArray1, stringArray2) {
  let i = dpTable.length - 1;
  let j = dpTable[0].length - 1;
  let ses1 = [];
  let ses2 = [];
  let ins = 'ins';
  let del = 'del';
  let keep = 'keep';
  while (i > 0 || j > 0) {
    if (i == 0) {
      ses2.unshift([ins, stringArray2[j - 1]]);
      j--;
    } else if (j == 0) {
      ses1.unshift([del, stringArray1[i - 1]]);
      i--;
    } else if (stringArray1[i - 1] == stringArray2[j - 1]) {
      ses1.unshift([keep, stringArray1[i - 1]]);
      ses2.unshift([keep, stringArray1[i - 1]]);
      i--;
      j--;
    } else if (dpTable[i - 1][j - 1] <= Math.min(dpTable[i - 1][j], dpTable[i][j - 1])) {
      ses1.unshift([del, stringArray1[i - 1]]);
      ses2.unshift([ins, stringArray2[j - 1]]);
      i--;
      j--;
    } else if (dpTable[i][j - 1] <= dpTable[i - 1][j]) {
      ses2.unshift([ins, stringArray2[j - 1]]);
      j--;
    } else {
      ses1.unshift([del, stringArray1[i - 1]]);
      i--;
    }
  }
  let diffStrings = [];
  for (let ses of [ses1, ses2]) {
    let diffString = '';
    let previousMode = keep;
    for (let k = 0; k < ses.length; k++) {
      let mode = ses[k][0];
      if (mode != previousMode) {
        if (previousMode != keep) {
          diffString += `</${previousMode}>`;
        } else {
          diffString += `<${mode}>`;
        }
        previousMode = mode;
      }
      diffString += ses[k][1];
      if (k == ses.length - 1) {
        if (mode != keep) {
          diffString += `</${mode}>`;
        }
      }
    }
    diffStrings.push(diffString);
  }
  return diffStrings;
};

const displayResults = function(results) {
  let resultTables = {};
  for (let original of Object.keys(results)) {
    let resultTable = '';
    for (let i = 0; i < results[original].length; i++) {
      let editDistance = results[original][i].pop();
      resultTable += `<tr class="${editDistance? 'different': 'same'}"><td>${results[original][i].join('</td><td>')}</td></tr>\n`;
    }
    resultTables[original] = resultTable;
  }
  var request = new XMLHttpRequest();
  request.open('GET', 'Trans_Diff_Template.html', true);
  request.responseType = 'blob';
  request.onload = function(e) {
      var reader = new FileReader();
      reader.onload =  function(e) {
        const templateMatch = /<!-- Template Start -->([^]+?)<!-- Template End -->/.exec(reader.result);
        let resultBlob = new Blob([
          reader.result.replace(
            '<title>{ph0}</title>',
            `<title>Trans_Diff_${Object.keys(results)[0]}</title>`
          ).replace(
            templateMatch[0],
            Object.keys(resultTables).map(original => templateMatch[1].replace('{ph1}', original).replace('{ph2}', resultTables[original].replace('$', '&#36;'))).join('\n')
          )
        ], {type: 'text/html'});
        let resultURL = window.URL.createObjectURL(resultBlob);
        let a = document.createElement('a');
        a.href = resultURL;
        a.download = `Trans_Diff_${Object.keys(results)[0]}.html`;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(resultURL);
        }, 0);
      };
      reader.readAsText(request.response);
  };
  request.send();

  focusTerminalWOScrolling();
};

})();
