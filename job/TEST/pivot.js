const lodash = require("lodash");

const pivotSummary = [
	{
		"dc" : "104",
		"dc_name" : "DC BALARAJA",
		"dept" : "Dry",
		"cancel_type" : "Cancel By system",
		"sku" : 95,
		"cancel_qty" : 9595,
		"value" : 148011330.51
	},
	{
		"dc" : "104",
		"dc_name" : "DC BALARAJA",
		"dept" : "Dry",
		"cancel_type" : "Durasi By Retek",
		"sku" : 19,
		"cancel_qty" : 1434,
		"value" : 6689560.4
	},
    {
		"dc" : "108",
		"dc_name" : "DC CIBITUNG",
		"dept" : "Frs",
		"cancel_type" : "Durasi By Retek",
		"sku" : 88,
		"cancel_qty" : 10608,
		"value" : 316872029.26
	},
	{
		"dc" : "108",
		"dc_name" : "DC CIBITUNG",
		"dept" : "Frs",
		"cancel_type" : "Cancel By system",
		"sku" : 58,
		"cancel_qty" : 2998.5,
		"value" : 75685565.88
	},
	{
		"dc" : "108",
		"dc_name" : "DC CIBITUNG",
		"dept" : "Dry",
		"cancel_type" : "Durasi By Retek",
		"sku" : 1,
		"cancel_qty" : 72,
		"value" : 784800
	},
    {
		"dc" : "110",
		"dc_name" : "DC PORONG",
		"dept" : "Frs",
		"cancel_type" : "Durasi By Retek",
		"sku" : 288,
		"cancel_qty" : 21787,
		"value" : 612407569.88
	},
	{
		"dc" : "110",
		"dc_name" : "DC PORONG",
		"dept" : "Dry",
		"cancel_type" : "Durasi By Retek",
		"sku" : 369,
		"cancel_qty" : 15308,
		"value" : 225353862.46
	},
	{
		"dc" : "110",
		"dc_name" : "DC PORONG",
		"dept" : "Dry",
		"cancel_type" : "Cancel By system",
		"sku" : 6,
		"cancel_qty" : 326,
		"value" : 2412624.76
	},
	{
		"dc" : "110",
		"dc_name" : "DC PORONG",
		"dept" : "Frs",
		"cancel_type" : "Cancel By system",
		"sku" : 4,
		"cancel_qty" : 48,
		"value" : 1686690
	}
];

const groupDc = lodash.groupBy(pivotSummary, 'dc');

for(const dc in groupDc){
    const sumValues = lodash.sumBy(groupDc[dc], 'value');
    const groupDept = lodash.groupBy(groupDc[dc].map(row => {
        const sumCriteria = lodash.sumBy(lodash.filter(groupDc[dc], { dept: row.dept, cancel_type: row.cancel_type }), "value")
        const pct = (sumCriteria / sumValues) * 100;
        return {
            ...row,
            pct: pct.toFixed(2) + "%"
        };
    }), "dept");
    console.log(groupDept)
}
