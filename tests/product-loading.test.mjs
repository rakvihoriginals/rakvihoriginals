import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { createClient } from '@supabase/supabase-js';

function loadLibrary(fetch) {
  const supabase = createClient('https://example.supabase.co', 'test-key', {
    global: { fetch }, auth: { persistSession: false, autoRefreshToken: false },
  });
  const source = ts.transpileModule(fs.readFileSync('src/lib/fetchProducts.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const compiled = { exports: {} };
  new Function('require', 'module', 'exports', source)(() => ({ supabase }), compiled, compiled.exports);
  return compiled.exports;
}
const product = {
  id: 1, name: 'Test bag', active: true, subcategory_id: 7, brand_id: 1,
  product_images: [{ id: 2, image_url: 'https://example.com/photo.jpg' }],
  product_variations: [{ id: 3, price: 1000, size_id: 50, stock: 4 }],
};
const response = (data) => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });

test('concurrent homepage categories share lookups and bounded requests do not poison full catalogue cache', async () => {
  const urls = [];
  const lib = loadLibrary(async (input) => {
    const url = new URL(input); urls.push(url);
    await new Promise(resolve => setImmediate(resolve));
    if (url.pathname.endsWith('/brands')) return response([{ id: 1, name_en: 'Brand' }]);
    if (url.pathname.endsWith('/attributes')) return response([{ id: 50, name: '100 CMS' }]);
    return response(Array.from({ length: url.searchParams.has('limit') ? 8 : 45 }, (_, i) => ({ ...product, id: i + 1 })));
  });
  const [home, duplicate] = await Promise.all([lib.fetchHomepage4CategoriesLatest(8), lib.fetchProductsBySubcategoryIds([7], 8)]);
  assert.equal(home.handbags.length, 8);
  assert.deepEqual(duplicate, home.handbags);
  assert.equal(urls.filter(u => u.pathname.endsWith('/brands')).length, 1);
  assert.equal(urls.filter(u => u.pathname.endsWith('/attributes')).length, 1);
  const queries = urls.filter(u => u.pathname.endsWith('/products'));
  assert.equal(queries.length, 4);
  for (const url of queries) {
    assert.equal(url.searchParams.get('limit'), '8');
    assert.equal(url.searchParams.get('product_images.limit'), '1');
    assert.equal(url.searchParams.get('product_images.order'), 'id.asc');
  }
  const all = await lib.fetchProductsBySubcategoryIds([7]);
  assert.equal(all.length, 45);
  assert.equal(all[0].priceValue, 850);
  assert.equal(all[0].variants[0].stock, 4);
  const count = urls.length;
  assert.equal(await lib.fetchProductsBySubcategoryIds([7]), all);
  assert.equal(urls.length, count);
});

test('main product becomes available before related products, with complete gallery and variants', async () => {
  let releaseRelated;
  const relatedGate = new Promise(resolve => { releaseRelated = resolve; });
  let showProduct;
  const shown = new Promise(resolve => { showProduct = resolve; });
  const lib = loadLibrary(async (input) => {
    const url = new URL(input);
    if (url.pathname.endsWith('/brands') || url.pathname.endsWith('/attributes')) return response([]);
    if (url.searchParams.get('id') === 'eq.1') {
      assert.equal(url.searchParams.has('product_images.limit'), false);
      return response({ ...product, product_images: [...product.product_images, { id: 4, image_url: 'https://example.com/back.jpg' }] });
    }
    await relatedGate;
    return response([product]);
  });
  let completed = false;
  const request = lib.fetchProductById(1, showProduct).then(result => { completed = true; return result; });
  const main = await shown;
  assert.equal(main.images.length, 2);
  assert.equal(main.variants.length, 1);
  assert.equal(completed, false);
  releaseRelated();
  assert.equal((await request).relatedProducts.length, 1);
});
