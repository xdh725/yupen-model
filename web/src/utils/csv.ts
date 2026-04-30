/**
 * CSV解析和生成工具
 */

import type { IndexData, CsvRow } from '@/types';

/**
 * 解析CSV文本为数据数组
 * @param csvText CSV文本
 * @returns 解析后的数据数组
 */
export function parseCsv(csvText: string): CsvRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return [];
  }

  // 解析表头
  const headers = lines[0].split(',').map(h => h.trim());
  const codeIndex = headers.findIndex(h => h.includes('代码') || h.toLowerCase().includes('code'));
  const nameIndex = headers.findIndex(h => h.includes('名称') || h.toLowerCase().includes('name'));
  const priceIndex = headers.findIndex(h => h.includes('当前价') || h.includes('现价') || h.toLowerCase().includes('price'));
  const ma20Index = headers.findIndex(h => h.includes('20日均线') || h.includes('均线') || h.toLowerCase().includes('ma20'));
  const dateIndex = headers.findIndex(h => h.includes('日期') || h.toLowerCase().includes('date'));

  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(',').map(v => v.trim());

    const row: CsvRow = {
      code: values[codeIndex >= 0 ? codeIndex : 0] || '',
      name: values[nameIndex >= 0 ? nameIndex : 1] || '',
      currentPrice: parseFloat(values[priceIndex >= 0 ? priceIndex : 2]) || 0,
      ma20: parseFloat(values[ma20Index >= 0 ? ma20Index : 3]) || 0,
      date: dateIndex >= 0 ? values[dateIndex] : undefined
    };

    if (row.code && row.name && row.currentPrice > 0 && row.ma20 > 0) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * 将指数数据导出为CSV格式
 * @param indices 指数数据数组
 * @returns CSV文本
 */
export function toCsv(indices: IndexData[]): string {
  const headers = ['排名', '代码', '名称', '状态', '当前价', '临界值', '偏离度(%)', '持续天数', '更新日期'];
  const headerLine = headers.join(',');

  const rows = indices.map(index => {
    const deviation = index.deviation >= 0 ? `+${index.deviation.toFixed(2)}` : index.deviation.toFixed(2);
    return [
      index.strength,
      index.code,
      index.name,
      index.status,
      index.currentPrice.toFixed(2),
      index.threshold.toFixed(2),
      deviation,
      index.duration,
      index.updatedAt
    ].join(',');
  });

  return [headerLine, ...rows].join('\n');
}

/**
 * 从文件读取CSV内容
 * @param file 文件对象
 * @returns Promise<string> CSV文本
 */
export function readCsvFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * 下载CSV文件
 * @param content CSV内容
 * @param filename 文件名
 */
export function downloadCsv(content: string, filename: string = 'yupen-data.csv'): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
