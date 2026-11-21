'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function item(name, hsn, price, qty, gstRate) {
  return { name, sku: name, hsn, price, qty, gstRate };
}

function compareCalculations(order, expectedInvoice, expectedPricing) {
  const invoiceFigures = invoice.computeInvoiceFigures(order);
  const pricingFigures = pricing.computeTotals(order.items, order.coupon);

  assert.deepEqual({
    subtotal: invoiceFigures.subtotal,
    discount: invoiceFigures.discount,
    tax: invoiceFigures.tax,
    cgst: invoiceFigures.cgst,
    sgst: invoiceFigures.sgst,
    total: invoiceFigures.total,
    rows: invoiceFigures.rows.map(({ gstPercent, line, lineTax }) => ({ gstPercent, line, lineTax }))
  }, expectedInvoice);

  assert.deepEqual({
    subtotal: pricingFigures.subtotal,
    discount: pricingFigures.discount,
    taxable: pricingFigures.taxable,
    tax: pricingFigures.tax,
    cgst: pricingFigures.cgst,
    sgst: pricingFigures.sgst,
    total: pricingFigures.total,
    lines: pricingFigures.lines.map(({ gstPercent, gross, discount, taxable, tax, net }) => ({
      gstPercent, gross, discount, taxable, tax, net
    }))
  }, expectedPricing);
}

test('CURRENT BEHAVIOUR: order #1001 mixes 18% tea and 5% dal with no coupon', () => {
  const order = {
    coupon: '',
    items: [
      item('Assam CTC Masala Chai 250g', '0902', 140, 2, 18),
      item('Unpolished Toor Dal 1kg', '0713', 165, 2, 5)
    ]
  };

  compareCalculations(order, {
    subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9,
    rows: [
      { gstPercent: 18, line: 280, lineTax: 50.4 },
      { gstPercent: 5, line: 330, lineTax: 16.5 }
    ]
  }, {
    subtotal: 610, discount: 0, taxable: 610, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9,
    lines: [
      { gstPercent: 18, gross: 280, discount: 0, taxable: 280, tax: 50.4, net: 330.4 },
      { gstPercent: 5, gross: 330, discount: 0, taxable: 330, tax: 16.5, net: 346.5 }
    ]
  });
});

test('CURRENT BEHAVIOUR: order #1002 invoice applies SAVE10 before GST like checkout', () => {
  const order = {
    coupon: 'SAVE10',
    items: [
      item('Indrayani Basmati Rice 5kg', '1006', 640, 1, 5),
      item('Cold-Pressed Sunflower Oil 1L', '1512', 190, 2, 5)
    ]
  };

  compareCalculations(order, {
    subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9,
    rows: [
      { gstPercent: 5, line: 640, lineTax: 28.8 },
      { gstPercent: 5, line: 380, lineTax: 17.1 }
    ]
  }, {
    subtotal: 1020, discount: 102, taxable: 918, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9,
    lines: [
      { gstPercent: 5, gross: 640, discount: 64, taxable: 576, tax: 28.8, net: 604.8 },
      { gstPercent: 5, gross: 380, discount: 38, taxable: 342, tax: 17.1, net: 359.1 }
    ]
  });
});

test('CURRENT BEHAVIOUR: order #1004 invoice honors the SAVE10 ₹150 cap', () => {
  const order = {
    coupon: 'SAVE10',
    items: [item('Cold-Pressed Groundnut Oil 5L', '1508', 1120, 2, 5)]
  };

  compareCalculations(order, {
    subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
    rows: [{ gstPercent: 5, line: 2240, lineTax: 104.5 }]
  }, {
    subtotal: 2240, discount: 150, taxable: 2090, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
    lines: [{ gstPercent: 5, gross: 2240, discount: 150, taxable: 2090, tax: 104.5, net: 2194.5 }]
  });
});

test('CURRENT BEHAVIOUR: order #1008 uses 18% GST on every line with no coupon', () => {
  const order = {
    coupon: '',
    items: [
      item('Assam CTC Masala Chai 250g', '0902', 140, 1, 18),
      item('Kokum Sherbet Concentrate 750ml', '2106', 180, 2, 18)
    ]
  };

  compareCalculations(order, {
    subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
    rows: [
      { gstPercent: 18, line: 140, lineTax: 25.2 },
      { gstPercent: 18, line: 360, lineTax: 64.8 }
    ]
  }, {
    subtotal: 500, discount: 0, taxable: 500, tax: 90, cgst: 45, sgst: 45, total: 590,
    lines: [
      { gstPercent: 18, gross: 140, discount: 0, taxable: 140, tax: 25.2, net: 165.2 },
      { gstPercent: 18, gross: 360, discount: 0, taxable: 360, tax: 64.8, net: 424.8 }
    ]
  });
});

test('invoice figures match checkout HSN slabs and capped pre-tax coupon totals', () => {
  const orders = [
    {
      coupon: 'SAVE10',
      items: [
        item('Indrayani Basmati Rice 5kg', '1006', 640, 1, 5),
        item('Cold-Pressed Sunflower Oil 1L', '1512', 190, 2, 5)
      ],
      expected: {
        subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9,
        rows: [{ gstPercent: 5, lineTax: 28.8 }, { gstPercent: 5, lineTax: 17.1 }]
      }
    },
    {
      coupon: 'SAVE10',
      items: [item('Cold-Pressed Groundnut Oil 5L', '1508', 1120, 2, 5)],
      expected: {
        subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
        rows: [{ gstPercent: 5, lineTax: 104.5 }]
      }
    }
  ];

  for (const order of orders) {
    const invoiceFigures = invoice.computeInvoiceFigures(order);
    const checkoutFigures = pricing.computeTotals(order.items, order.coupon);
    const actual = {
      subtotal: invoiceFigures.subtotal,
      discount: invoiceFigures.discount,
      tax: invoiceFigures.tax,
      cgst: invoiceFigures.cgst,
      sgst: invoiceFigures.sgst,
      total: invoiceFigures.total,
      rows: invoiceFigures.rows.map(({ gstPercent, lineTax }) => ({ gstPercent, lineTax }))
    };
    const checkout = {
      subtotal: checkoutFigures.subtotal,
      discount: checkoutFigures.discount,
      tax: checkoutFigures.tax,
      cgst: checkoutFigures.cgst,
      sgst: checkoutFigures.sgst,
      total: checkoutFigures.total,
      rows: checkoutFigures.lines.map(({ gstPercent, tax }) => ({ gstPercent, lineTax: tax }))
    };

    assert.deepEqual(actual, order.expected);
    assert.deepEqual(actual, checkout);
  }
});
