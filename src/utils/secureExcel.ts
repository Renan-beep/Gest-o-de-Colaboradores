import * as XLSX from 'xlsx';

// XSS protection - sanitize text content
const sanitizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  
  // Convert to string and remove potential XSS vectors
  const cleaned = String(text)
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/script/gi, '') // Remove script tags
    .trim();
  
  return cleaned;
};

// Validate Excel file type
export const validateExcelFile = (file: File): boolean => {
  const validTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/xlsx',
    'application/xls'
  ];
  
  const validExtensions = ['.xlsx', '.xls'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  
  return validTypes.includes(file.type) || validExtensions.includes(fileExtension);
};

// Validate file size (max 10MB)
export const validateFileSize = (file: File): boolean => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return file.size <= maxSize;
};

// Validate and sanitize collaborator data
export const validateColaboradorData = (data: any): any => {
  return {
    matricula: sanitizeText(data.matricula || data.Matricula || data.MATRICULA),
    colaborador: sanitizeText(data.colaborador || data.Colaborador || data.COLABORADOR || data.nome || data.Nome || data.NOME),
    cargo: sanitizeText(data.cargo || data.Cargo || data.CARGO),
    setor: sanitizeText(data.setor || data.Setor || data.SETOR),
    subsetor: sanitizeText(data.subsetor || data.Subsetor || data.SUBSETOR),
    lideranca: sanitizeText(data.lideranca || data.Lideranca || data.LIDERANCA || data.lider || data.Lider || data.LIDER),
    turno: sanitizeText(data.turno || data.Turno || data.TURNO),
    horario_cafe: sanitizeText(data.horario_cafe || data.Horario_Cafe || data.HORARIO_CAFE || data['Horário Café'] || data['HORÁRIO CAFÉ']),
    sabado_trabalho: sanitizeText(data.sabado_trabalho || data.Sabado_Trabalho || data.SABADO_TRABALHO || data['Sábado Trabalho'] || data['SÁBADO TRABALHO']),
    horario_almoco: sanitizeText(data.horario_almoco || data.Horario_Almoco || data.HORARIO_ALMOCO || data['Horário Almoço'] || data['HORÁRIO ALMOÇO']),
    admissao: data.admissao || data.Admissao || data.ADMISSAO || data.admissão || data.Admissão || data.ADMISSÃO,
  };
};

// Safe Excel reading with validation
export const readExcelFile = async (file: File): Promise<any[]> => {
  // Validate file
  if (!validateExcelFile(file)) {
    throw new Error('Arquivo deve ser um Excel válido (.xlsx ou .xls)');
  }
  
  if (!validateFileSize(file)) {
    throw new Error('Arquivo muito grande. Máximo 10MB permitido.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Arquivo Excel não contém planilhas');
        }
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        if (!worksheet) {
          throw new Error('Não foi possível ler a planilha');
        }
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        // Validate and sanitize each row
        const sanitizedData = jsonData.map(validateColaboradorData);
        
        // Filter out empty rows
        const validData = sanitizedData.filter(row => 
          row.matricula && row.colaborador
        );
        
        if (validData.length === 0) {
          throw new Error('Arquivo não contém dados válidos. Verifique se as colunas "matricula" e "colaborador" estão preenchidas.');
        }
        
        resolve(validData);
      } catch (error) {
        reject(new Error(`Erro ao processar arquivo Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Safe Excel export
export const exportToExcel = (data: any[], filename: string = 'colaboradores'): void => {
  try {
    console.log('Iniciando exportação com', data.length, 'itens');
    
    // Sanitize data before export
    const sanitizedData = data.map(item => ({
      'Matrícula': sanitizeText(item.matricula),
      'Colaborador': sanitizeText(item.colaborador),
      'Status': sanitizeText(item.status),
      'Cargo': sanitizeText(item.cargo),
      'Setor': sanitizeText(item.setor),
      'Subsetor': sanitizeText(item.subsetor),
      'Liderança': sanitizeText(item.lideranca),
      'Turno': sanitizeText(item.turno),
      'Sábado Trabalho': sanitizeText(item.sabado_trabalho),
      'Sábado Horário': sanitizeText(item.sabado_horario),
      'Horário Almoço': sanitizeText(item.horario_almoco),
      'Horário Café': sanitizeText(item.horario_cafe),
      'Admissão': item.admissao || '',
      'Tempo de Empresa': item.tempo_empresa || '',
    }));
    
    const ws = XLSX.utils.json_to_sheet(sanitizedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Colaboradores');
    
    const sanitizedFilename = sanitizeText(filename);
    XLSX.writeFile(wb, `${sanitizedFilename}.xlsx`);
    console.log('Exportação concluída:', `${sanitizedFilename}.xlsx`);
  } catch (error) {
    console.error('Erro na exportação:', error);
    throw new Error(`Erro ao exportar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};