const axios = require('axios');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// === CONFIG ===
const DATA_URL = 'https://menu-api-v0.arbys-api.uat.irb.digital/menu/brand/ARB/location/99983/channel/WEBOA/type/ALLDAY?preview=false'; // Replace with actual endpoint
const brandMatch = DATA_URL.match(/brand\/([^/]+)/);
const BRAND = brandMatch ? brandMatch[1] : 'UNKNOWN';
const OUTPUT_FILE = path.join(__dirname, `${BRAND}_product_nutrition_info.xlsx`);

// === HELPERS ===
const looksLikeProductKey = key => /-prd-/.test(key);
const looksLikeItemKey = key => /-itm-/.test(key);

// === MAIN ===
async function fetchAndExportNutrition() {
    try {
        const { data: res } = await axios.get(DATA_URL);

        const data = [];

        const products = res.products || {};
        for (const productKey in products) {
            if (!looksLikeProductKey(productKey)) continue;

            const product = products[productKey];
            const items = product.items || {};

            for (const itemKey in items) {
                if (!looksLikeItemKey(itemKey)) continue;

                const item = items[itemKey];
                const nutrition = item.nutrition || {};
                const row = {
                    productId: itemKey,
                    totalCalories: nutrition.totalCalories ?? '',
                };

                const macros = nutrition.macroNutrients || {};
                for (const macroKey in macros) {
                    row[macroKey] = macros[macroKey]?.weight?.value ?? '';
                }

                data.push(row);
            }
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Nutrition Info');
        XLSX.writeFile(workbook, OUTPUT_FILE);

        console.log(`✅ Excel created at: ${OUTPUT_FILE}`);
    } catch (err) {
        console.error('❌ Failed to fetch or process data:', err.message);
    }
}

fetchAndExportNutrition();
