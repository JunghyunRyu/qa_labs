/**
 * Contract Parser - 함수 시그니처와 반환 인터페이스 파싱
 *
 * M5-1: 좌측 Contract 고정 노출 기능용
 */

export interface Parameter {
  name: string;
  type: string;
  optional?: boolean;
  default?: string;
}

export interface InterfaceField {
  name: string;
  type: string;
  description?: string;
}

export interface InterfaceDefinition {
  name: string;
  fields: InterfaceField[];
  docstring?: string;
}

export interface ContractInfo {
  functionName: string;
  parameters: Parameter[];
  returnType: string | null;
  returnInterface?: InterfaceDefinition;
  rawSignature: string;
}

/**
 * Python 함수 시그니처 파싱
 * 예: def calculate_tax(income: float, deductions: list[float] = []) -> TaxResult:
 */
export function parseSignature(signature: string): Omit<ContractInfo, 'returnInterface' | 'rawSignature'> {
  const result: Omit<ContractInfo, 'returnInterface' | 'rawSignature'> = {
    functionName: '',
    parameters: [],
    returnType: null,
  };

  // 함수 이름 추출
  const funcNameMatch = signature.match(/def\s+(\w+)\s*\(/);
  if (funcNameMatch) {
    result.functionName = funcNameMatch[1];
  }

  // 반환 타입 추출
  const returnMatch = signature.match(/->\s*([^:]+?)(?:\s*:|$)/);
  if (returnMatch) {
    result.returnType = returnMatch[1].trim();
  }

  // 파라미터 추출 (괄호 안의 내용)
  const paramsMatch = signature.match(/\(([^)]*)\)/);
  if (paramsMatch) {
    const paramsStr = paramsMatch[1].trim();
    if (paramsStr) {
      result.parameters = parseParameters(paramsStr);
    }
  }

  return result;
}

/**
 * 파라미터 문자열 파싱
 * 괄호와 대괄호 내의 쉼표는 무시하고 분리
 */
function parseParameters(paramsStr: string): Parameter[] {
  const params: Parameter[] = [];
  let depth = 0;
  let current = '';

  for (const char of paramsStr) {
    if (char === '(' || char === '[' || char === '{' || char === '<') {
      depth++;
      current += char;
    } else if (char === ')' || char === ']' || char === '}' || char === '>') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      if (current.trim()) {
        const param = parseParameter(current.trim());
        if (param) params.push(param);
      }
      current = '';
    } else {
      current += char;
    }
  }

  // 마지막 파라미터
  if (current.trim()) {
    const param = parseParameter(current.trim());
    if (param) params.push(param);
  }

  return params;
}

/**
 * 단일 파라미터 파싱
 * 예: income: float, deductions: list[float] = []
 */
function parseParameter(paramStr: string): Parameter | null {
  // self, cls 등 제외
  if (paramStr === 'self' || paramStr === 'cls') {
    return null;
  }

  // *args, **kwargs 처리
  if (paramStr.startsWith('*')) {
    const name = paramStr.replace(/^\*+/, '');
    const colonIdx = name.indexOf(':');
    if (colonIdx !== -1) {
      return {
        name: (paramStr.startsWith('**') ? '**' : '*') + name.substring(0, colonIdx).trim(),
        type: name.substring(colonIdx + 1).trim(),
      };
    }
    return { name: paramStr, type: 'Any' };
  }

  // 기본값 분리
  let defaultValue: string | undefined;
  let mainPart = paramStr;

  // = 이후는 기본값 (단, 대괄호/괄호 안의 = 제외)
  let depth = 0;
  for (let i = 0; i < paramStr.length; i++) {
    const char = paramStr[i];
    if (char === '(' || char === '[' || char === '{' || char === '<') {
      depth++;
    } else if (char === ')' || char === ']' || char === '}' || char === '>') {
      depth--;
    } else if (char === '=' && depth === 0) {
      mainPart = paramStr.substring(0, i).trim();
      defaultValue = paramStr.substring(i + 1).trim();
      break;
    }
  }

  // 이름과 타입 분리
  const colonIdx = mainPart.indexOf(':');
  if (colonIdx !== -1) {
    return {
      name: mainPart.substring(0, colonIdx).trim(),
      type: mainPart.substring(colonIdx + 1).trim(),
      optional: defaultValue !== undefined,
      default: defaultValue,
    };
  }

  // 타입 힌트 없는 경우
  return {
    name: mainPart,
    type: 'Any',
    optional: defaultValue !== undefined,
    default: defaultValue,
  };
}

/**
 * 마크다운에서 클래스/인터페이스 정의 추출
 * 예: class TaxResult:\n    tax_amount: float\n    ...
 */
export function parseInterfaceFromMarkdown(markdown: string, typeName: string): InterfaceDefinition | undefined {
  if (!typeName) return undefined;

  // 단순 타입은 인터페이스 검색 불필요
  const simpleTypes = ['int', 'float', 'str', 'bool', 'None', 'list', 'dict', 'tuple', 'set', 'Any'];
  const baseType = typeName.split('[')[0].trim();
  if (simpleTypes.includes(baseType)) {
    return undefined;
  }

  // 코드 블록에서 클래스 정의 찾기
  const codeBlockRegex = /```(?:python)?\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(markdown)) !== null) {
    const code = match[1];
    const interfaceDef = parseClassDefinition(code, typeName);
    if (interfaceDef) {
      return interfaceDef;
    }
  }

  // 코드 블록 외부에서도 클래스 정의 찾기 (인라인)
  return parseClassDefinition(markdown, typeName);
}

/**
 * 코드에서 클래스 정의 파싱
 */
function parseClassDefinition(code: string, className: string): InterfaceDefinition | undefined {
  // 클래스 정의 찾기: class ClassName: 또는 class ClassName(BaseClass):
  const classRegex = new RegExp(
    `class\\s+${escapeRegex(className)}(?:\\s*\\([^)]*\\))?\\s*:\\s*\\n([\\s\\S]*?)(?=\\nclass\\s|\\ndef\\s|$)`,
    'i'
  );

  const match = code.match(classRegex);
  if (!match) return undefined;

  const classBody = match[1];
  const fields: InterfaceField[] = [];
  let docstring: string | undefined;

  // Docstring 추출
  const docMatch = classBody.match(/^\s*(?:"""([\s\S]*?)"""|'''([\s\S]*?)''')/);
  if (docMatch) {
    docstring = (docMatch[1] || docMatch[2]).trim();
  }

  // 필드 추출 (타입 힌트가 있는 속성)
  const fieldRegex = /^\s+(\w+)\s*:\s*([^=\n]+?)(?:\s*=.*)?$/gm;
  let fieldMatch;

  while ((fieldMatch = fieldRegex.exec(classBody)) !== null) {
    const fieldName = fieldMatch[1];
    const fieldType = fieldMatch[2].trim();

    // 특수 속성 제외
    if (fieldName.startsWith('_')) continue;

    fields.push({
      name: fieldName,
      type: fieldType,
    });
  }

  if (fields.length === 0) return undefined;

  return {
    name: className,
    fields,
    docstring,
  };
}

/**
 * 정규식 특수문자 이스케이프
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 전체 Contract 정보 추출
 */
export function parseContract(signature: string, descriptionMd: string): ContractInfo {
  const signatureInfo = parseSignature(signature);

  let returnInterface: InterfaceDefinition | undefined;
  if (signatureInfo.returnType) {
    // list[X], Optional[X] 등에서 내부 타입 추출
    const innerTypeMatch = signatureInfo.returnType.match(/(?:list|List|Optional|Union)\[([^\]]+)\]/);
    const typeToSearch = innerTypeMatch ? innerTypeMatch[1].split(',')[0].trim() : signatureInfo.returnType;

    returnInterface = parseInterfaceFromMarkdown(descriptionMd, typeToSearch);
  }

  return {
    ...signatureInfo,
    returnInterface,
    rawSignature: signature,
  };
}

/**
 * 시그니처를 포맷팅된 문자열로 변환 (구문 강조용)
 */
export function formatSignatureForDisplay(contract: ContractInfo): string {
  const { functionName, parameters, returnType } = contract;

  const paramsStr = parameters
    .map(p => {
      let str = p.name;
      if (p.type && p.type !== 'Any') {
        str += `: ${p.type}`;
      }
      if (p.default !== undefined) {
        str += ` = ${p.default}`;
      }
      return str;
    })
    .join(', ');

  let result = `def ${functionName}(${paramsStr})`;
  if (returnType) {
    result += ` -> ${returnType}`;
  }
  result += ':';

  return result;
}

/**
 * 인터페이스를 포맷팅된 문자열로 변환
 */
export function formatInterfaceForDisplay(iface: InterfaceDefinition): string {
  const lines: string[] = [];

  lines.push(`class ${iface.name}:`);

  if (iface.docstring) {
    lines.push(`    """${iface.docstring}"""`);
  }

  for (const field of iface.fields) {
    lines.push(`    ${field.name}: ${field.type}`);
  }

  return lines.join('\n');
}
