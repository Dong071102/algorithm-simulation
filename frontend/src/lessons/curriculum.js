// ============================================================================
// Curriculum Manifest
//   Ch. 1: Bài toán Max-Flow (11 Thuật toán + 3 Case Study)
//   Ch. 2: Cấu trúc Cây Lưu trữ & Chỉ mục (7 loại Cây)
// ============================================================================

import { lessonFordFulkerson } from './ch1_fordFulkerson.js';
import { lessonEdmondsKarp } from './ch1_edmondsKarp.js';
import { lessonCapacityScaling } from './ch1_capacityScaling.js';
import { lessonDinic } from './ch2_dinic.js';
import { lessonMPM } from './ch2_mpm.js';
import { lessonISAP } from './ch2_isap.js';
import { lessonPushRelabel } from './ch3_pushRelabel.js';
import { lessonPseudoflow } from './ch3_pseudoflow.js';
import { lessonBoykovKolmogorov } from './ch3_boykovKolmogorov.js';
import { lessonIBFS } from './ch3_ibfs.js';
import { lessonPlanar } from './ch4_planar.js';
import { lessonCaseCdn } from './ch4_caseCdn.js';
import { lessonCaseMatching } from './ch4_caseMatching.js';
import { lessonCaseSegmentation } from './ch4_caseSegmentation.js';

import { lessonBTree } from './t1_btree.js';
import { lessonBPlusTree } from './t2_bplustree.js';
import { lessonBLinkTree } from './t3_blinktree.js';
import { lessonBEpsilon } from './t4_bepsilon.js';
import { lessonLSMTree } from './t5_lsmtree.js';
import { lessonBufferTree } from './t6_buffertree.js';
import { lessonRTree } from './t7_rtree.js';
import { lessonKDTree } from './t8_kdtree.js';

export const MODULES = [
  {
    id: 'ch1',
    title: 'Ch. 1: Bài toán Max-Flow',
    color: 'var(--green-3)',
    lessons: [
      { group: 'Augmenting Paths' },
      lessonFordFulkerson,
      lessonEdmondsKarp,
      lessonCapacityScaling,

      { group: 'Level Graph & Blocking Flow' },
      lessonDinic,
      lessonMPM,
      lessonISAP,

      { group: 'Preflow & Dual-Tree' },
      lessonPushRelabel,
      lessonPseudoflow,
      lessonBoykovKolmogorov,
      lessonIBFS,

      { group: 'Đồ thị phẳng & Case Study' },
      lessonPlanar,
      lessonCaseCdn,
      lessonCaseMatching,
      lessonCaseSegmentation,
    ],
  },
  {
    id: 'ch2',
    title: 'Ch. 2: Cấu trúc Cây (Trees)',
    color: 'var(--amber-2)',
    lessons: [
      { group: 'B-Tree & Biến thể Đĩa' },
      lessonBTree,
      lessonBPlusTree,
      lessonBLinkTree,

      { group: 'Write-Optimized & External Memory' },
      lessonBEpsilon,
      lessonLSMTree,
      lessonBufferTree,

      { group: 'Không gian 2D / 3D (Spatial)' },
      lessonRTree,
      lessonKDTree,
    ],
  },
];

export function getAllReadyLessons() {
  return MODULES.flatMap((m) => m.lessons.filter((l) => !l.group && !l.soon));
}

export function findLessonById(id) {
  for (const m of MODULES) {
    const found = m.lessons.find((l) => !l.group && l.id === id && !l.soon);
    if (found) return { module: m, lesson: found };
  }
  return null;
}
