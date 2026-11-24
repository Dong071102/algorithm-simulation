// ============================================================================
// Ch. 2 — Bài 5: LSM-Tree (Log-Structured Merge-Tree — RocksDB, Cassandra)
// ============================================================================

const CODE = [
  'function lsmPut(key, value) {',
  '  wal.append(key, value);              // 1. Ghi nối đuôi tuần tự (Sequential I/O!)',
  '  memTable.put(key, value);            // 2. Chèn vào cây cân bằng trong RAM',
  '  if (memTable.size >= LIMIT) {',
  '    flushToSSTable(memTable → L0);     // 3. Đổ toàn bộ RAM thành file SSTable bất biến',
  '    if (L0.files.length >= 4) compact(L0 → L1); // 4. Gộp nền (Compaction) & lọc trùng!',
  '  }',
  '}',
];

export const lessonLSMTree = {
  id: 'lsm-tree',
  chapterId: 'ch2',
  title: '5. LSM-Tree (RocksDB)',
  complexity: 'Write: O(1) Seq I/O',
  complexityAnalysis: {
    time: 'Write: O(1) RAM + Seq I/O | Read: O(L · log N) (nhờ Bloom Filter → ~O(1))',
    space: 'O(N) + hệ số khuếch đại không gian thấp',
    classType: 'Log-Structured Storage Engine (RocksDB, LevelDB, Cassandra, ScyllaDB)',
    derivation: [
      { step: '1. Ghi (Write) = 100% tuần tự', formula: 'WAL append + MemTable RAM', note: 'Biến mọi thao tác ghi ngẫu nhiên thành ghi nối đuôi (Append-only) → tốc độ ghi cao gấp 10×–100× B+ Tree trên SSD/HDD!' },
      { step: '2. Compaction (Merge-Sort nền)', formula: 'L0 → L1 (×10) → L2 (×100)', note: 'Gộp các file SSTable bất biến ở tầng trên xuống tầng dưới, loại bỏ khóa bị ghi đè và bản ghi xóa (tombstone).' },
      { step: '3. Đọc (Read) & Bloom Filter', formula: 'Kiểm tra MemTable → L0 → L1 → L2', note: 'Nếu không có Bloom Filter phải dò nhiều SSTable; Bloom Filter loại bỏ ~99% file không chứa khóa ngay trong RAM!' },
    ],
    worstCase: 'Write Amplification trong quá trình Compaction nền và độ trễ đọc kém ổn định hơn B+ Tree nếu miss Bloom Filter.',
    vsOthers: [
      { algo: 'B+ Tree', diff: 'B+ Tree cập nhật tại chỗ (in-place random I/O); LSM-Tree chỉ ghi tuần tự (out-of-place immutable SSTables) nên cực mạnh cho Write-heavy!' },
    ],
  },
  pseudocode: CODE,
  legend: [
    { type: 'dot', color: 'var(--green-3)', label: 'RAM: WAL + MemTable (Ghi tức thì)' },
    { type: 'dot', color: 'var(--amber-2)', label: 'Flush → SSTable L0 bất biến trên đĩa' },
    { type: 'dot', color: 'var(--violet-2)', label: 'Compaction gộp L0 → L1 sạch trùng lặp' },
  ],
  steps: [
    {
      short: '1. Ghi RAM + WAL',
      tag: 'Biến Random Write → Sequential Write!',
      title: 'Ghi nối đuôi vào WAL & chèn MemTable (RAM) trong O(1) đĩa!',
      activeLines: [2, 3],
      body: [
        'Thay vì sửa từng trang 4KB rải rác trên đĩa như B+ Tree, <span class="term">LSM-Tree</span> chỉ <b>ghi nối đuôi vào WAL (Write-Ahead Log)</b> để chống mất điện, và chèn vào <b>MemTable (SkipList/RB-Tree) ngay trong RAM</b>.',
        'Vì không hề seek đĩa ngẫu nhiên, tốc độ ghi đạt hàng trăm nghìn ops/giây!',
      ],
      changes: ['+ Append WAL: PUT(k=42, v="A") (Sequential I/O)', '+ Chèn vào MemTable trong RAM [k=10, 42, 88] (Đầy 3/3!)'],
      metrics: [
        { id: 'w', label: 'Write I/O', value: 'Sequential O(1)', level: 'good' },
        { id: 'mem', label: 'MemTable', value: 'ĐẦY → Sắp Flush', level: 'warn' },
      ],
      scene: {
        nodes: [
          { id: 'WAL', shape: 'box', label: 'WAL (Append Log)', sub: 'Đĩa tuần tự', x: 130, y: 80, state: 'tree-s' },
          { id: 'MEM', shape: 'box', label: 'MemTable [10, 42, 88]', sub: 'RAM (ĐẦY!)', badge: 'RAM', x: 470, y: 80, state: 'active', spot: true },
          { id: 'L0A', shape: 'box', label: 'SST-0a [5..50]', sub: 'Disk Level 0', x: 240, y: 215, state: 'idle' },
          { id: 'L0B', shape: 'box', label: 'SST-0b [20..90]', sub: 'Disk Level 0', x: 520, y: 215, state: 'idle' },
          { id: 'L1', shape: 'box', label: 'Level 1 [1..40] | [41..99]', sub: 'Disk Level 1 (Không chồng lấn)', x: 380, y: 335, state: 'visited' },
        ],
        edges: [
          { id: 'E1', from: 'WAL', to: 'MEM', flow: 1, cap: 1, kind: 'augment', label: 'PUT(42)' },
          { id: 'E2', from: 'MEM', to: 'L0B', flow: 0, cap: 1, kind: 'off', label: '' },
          { id: 'E3', from: 'L0A', to: 'L1', flow: 0, cap: 1, label: '' },
          { id: 'E4', from: 'L0B', to: 'L1', flow: 0, cap: 1, label: '' },
        ],
      },
    },
    {
      short: '2. Flush & Compaction',
      tag: 'Merge-Sort nền: L0 → L1 (Loại bỏ trùng lặp)',
      title: 'Flush MemTable → L0, sau đó Compaction gộp L0 vào L1!',
      activeLines: [4, 5, 6],
      body: [
        'Khi MemTable đầy, nó được đổ tuần tự thành 1 file <b>SSTable bất biến (Immutable)</b> ở tầng <code>L0</code>.',
        'Khi <code>L0</code> có nhiều file chồng lấn khóa, tiến trình nền chạy <span class="term">Compaction (Merge-Sort)</span> gộp toàn bộ <code>L0</code> xuống <code>L1</code>: giữ lại phiên bản mới nhất của mỗi khóa và loại bỏ dữ liệu đã xóa (tombstone)!',
      ],
      changes: ['+ Flush MemTable → SST-0c trên đĩa (tuần tự 100%)', '+ Compaction gộp L0 → L1 thành các dải khóa tách biệt không chồng lấn'],
      callout: { kind: 'tip', title: 'Đọc nhanh nhờ Bloom Filter', text: 'Mỗi file SSTable đi kèm 1 Bloom Filter nhỏ trong RAM giúp bỏ qua ngay lập tức các file không chứa khóa cần tìm!' },
      metrics: [
        { id: 'comp', label: 'Compaction', value: 'L0 → L1 xong ✓', level: 'good' },
        { id: 'read', label: 'Bloom Filter', value: 'Bỏ qua 99% SST', level: 'violet' },
      ],
      scene: {
        nodes: [
          { id: 'WAL', shape: 'box', label: 'WAL (Mới)', sub: 'Đĩa tuần tự', x: 130, y: 80, state: 'idle' },
          { id: 'MEM', shape: 'box', label: 'MemTable [ trống ]', sub: 'RAM sẵn sàng', x: 470, y: 80, state: 'source' },
          { id: 'L0A', shape: 'box', label: 'SST-0a (đã gộp)', x: 240, y: 210, state: 'dead' },
          { id: 'L0B', shape: 'box', label: 'SST-0b (đã gộp)', x: 520, y: 210, state: 'dead' },
          { id: 'L1', shape: 'box', label: 'L1 Clean: [1..40] | [41..99]', sub: 'Đã khử trùng & sắp xếp!', badge: 'COMPACTED', x: 380, y: 335, state: 'tree-s', spot: true },
        ],
        edges: [
          { id: 'E1', from: 'MEM', to: 'L0B', flow: 1, cap: 1, kind: 'tree-s', label: 'Flush' },
          { id: 'E2', from: 'L0A', to: 'L1', flow: 1, cap: 1, kind: 'augment', label: 'Merge' },
          { id: 'E3', from: 'L0B', to: 'L1', flow: 1, cap: 1, kind: 'augment', label: 'Merge' },
        ],
      },
    },
  ],
};
