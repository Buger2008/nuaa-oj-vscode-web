/** 最小 POSIX/Windows 路径字符串工具，用于替代 Node 的 path 模块。 */

export function extname(filePath: string): string {
  const clean = String(filePath || '').split(/[?#]/)[0];
  const slash = Math.max(clean.lastIndexOf('/'), clean.lastIndexOf('\\'));
  const dot = clean.lastIndexOf('.');
  return dot > slash ? clean.slice(dot) : '';
}

export function basename(filePath: string): string {
  const clean = String(filePath || '').replace(/[\\/]+$/, '');
  const slash = Math.max(clean.lastIndexOf('/'), clean.lastIndexOf('\\'));
  return slash >= 0 ? clean.slice(slash + 1) : clean;
}

export function join(...parts: string[]): string {
  const values = parts.filter((p) => p !== undefined && p !== null && String(p) !== '');
  if (!values.length) return '';
  const separator = values.some((p) => String(p).includes('\\')) ? '\\' : '/';
  const joined = values.map((p, i) => {
    const s = String(p);
    if (i === 0) return s.replace(/[\\/]+$/, '');
    return s.replace(/^[\\/]+|[\\/]+$/g, '');
  }).filter(Boolean).join(separator);
  return joined || separator;
}
