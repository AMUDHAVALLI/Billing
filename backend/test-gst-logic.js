import { calculateGST } from './src/utils/gstCalculator.js';
import { areStatesSame } from './src/utils/stateMapping.js';

function testAreStatesSame() {
  console.log('Testing areStatesSame...');
  const tests = [
    { s1: 'Puducherry', s2: 'Puducherry', c1: '34', c2: '34', expected: true, msg: 'Exact match with codes' },
    { s1: 'Puducherry', s2: 'Pondicherry', c1: '34', c2: '', expected: true, msg: 'Name variation Puducherry/Pondicherry' },
    { s1: 'Puducherry', s2: 'Tamil Nadu', c1: '34', c2: '33', expected: false, msg: 'Different states' },
    { s1: 'PUDUCHERRY', s2: 'puducherry', c1: '', c2: '', expected: true, msg: 'Case insensitive' },
    { s1: 'PUDUCHERRY ', s2: 'puducherry', c1: '', c2: '', expected: true, msg: 'Trim whitespace' },
    { s1: 'Unknown', s2: 'Unknown', c1: '34', c2: '34', expected: true, msg: 'Match by code only' },
  ];

  let passed = 0;
  tests.forEach(t => {
    const result = areStatesSame(t.s1, t.s2, t.c1, t.c2);
    if (result === t.expected) {
      console.log(`✅ PASSED: ${t.msg}`);
      passed++;
    } else {
      console.log(`❌ FAILED: ${t.msg} (Expected ${t.expected}, got ${result})`);
    }
  });
  console.log(`Summary: ${passed}/${tests.length} tests passed.\n`);
}

function testCalculateGST() {
  console.log('Testing calculateGST...');
  const items = [
    { rate: 100, quantity: 1, gstRate: 18, description: 'Test Item', hsnCode: '123' }
  ];

  // Test Intra-state
  const intra = calculateGST(items, 'Puducherry', 'Pondicherry', '34', '');
  console.log('Intra-state (Puducherry vs Pondicherry):');
  console.log(`CGST: ${intra.cgst}, SGST: ${intra.sgst}, IGST: ${intra.igst}`);
  if (intra.cgst === 9 && intra.sgst === 9 && intra.igst === 0) {
    console.log('✅ PASSED: Intra-state identified correctly');
  } else {
    console.log('❌ FAILED: Intra-state calculation incorrect');
  }

  // Test Inter-state
  const inter = calculateGST(items, 'Puducherry', 'Tamil Nadu', '34', '33');
  console.log('\nInter-state (Puducherry vs Tamil Nadu):');
  console.log(`CGST: ${inter.cgst}, SGST: ${inter.sgst}, IGST: ${inter.igst}`);
  if (inter.cgst === 0 && inter.sgst === 0 && inter.igst === 18) {
    console.log('✅ PASSED: Inter-state identified correctly');
  } else {
    console.log('❌ FAILED: Inter-state calculation incorrect');
  }
}

testAreStatesSame();
testCalculateGST();
