export const financialData = {
  monthlyIncome: 150000, // Assuming a healthy income for a balanced tracker
  assets: [
    { id: 1, name: "Parag Parikh Flexi Cap", value: 250000, type: 'stocks' },
    { id: 2, name: "Vanguard S&P 500 ETF", value: 300000, type: 'stocks' },
    { id: 3, name: "Gold ETF", value: 100000, type: 'bullion' },
    { id: 4, name: "HDFC Bank Balance", value: 120000, type: 'other' },
  ],
  liabilities: [
    { id: 1, name: "Credit Card Debt", value: 25000 },
  ],
  netWorth: 1245000, // Calculated: (Assets + EPF) - Liabilities
  creditScore: 760, // Good credit score
  epf: 500000, // Healthy EPF contribution
  netWorthHistory: [
     // 2023 Data
    { year: 2023, month: 'Jan', value: 700000 },
    { year: 2023, month: 'Feb', value: 720000 },
    { year: 2023, month: 'Mar', value: 750000 },
    { year: 2023, month: 'Apr', value: 780000 },
    { year: 2023, month: 'May', value: 810000 },
    { year: 2023, month: 'Jun', value: 850000 },
    { year: 2023, month: 'Jul', value: 880000 },
    { year: 2023, month: 'Aug', value: 920000 },
    { year: 2023, month: 'Sep', value: 950000 },
    { year: 2023, month: 'Oct', value: 980000 },
    { year: 2023, month: 'Nov', value: 1020000 },
    { year: 2023, month: 'Dec', value: 1050000 },
    // 2024 Data
    { year: 2024, month: 'Jan', value: 1080000 },
    { year: 2024, month: 'Feb', value: 1120000 },
    { year: 2024, month: 'Mar', value: 1150000 },
    { year: 2024, month: 'Apr', value: 1180000 },
    { year: 2024, month: 'May', value: 1210000 },
    { year: 2024, month: 'Jun', value: 1245000 },
  ],
  investments: [
    { name: 'Parag Parikh Flexi Cap', type: 'Mutual Fund', value: 250000, performance: 12 },
    { name: 'Vanguard S&P 500 ETF', type: 'ETF', value: 300000, performance: 15 },
    { name: 'Gold ETF', type: 'ETF', value: 100000, performance: 8 },
  ],
};

export const getTotalAssets = () => {
    return financialData.assets.reduce((acc, asset) => acc + asset.value, 0) + financialData.epf;
}

export const getTotalLiabilities = () => {
    return financialData.liabilities.reduce((acc, loan) => acc + loan.value, 0);
}

export const getFinancialDataAsString = () => {
    const totalAssets = getTotalAssets();
    const totalLiabilities = getTotalLiabilities();
    const netWorth = totalAssets - totalLiabilities;

    return JSON.stringify({
    assets: `₹${totalAssets.toLocaleString('en-IN')}`,
    liabilities: `₹${totalLiabilities.toLocaleString('en-IN')}`,
    netWorth: `₹${netWorth.toLocaleString('en-IN')}`,
    creditScore: financialData.creditScore,
    epfBalance: `₹${financialData.epf.toLocaleString('en-IN')}`,
    detailedAssets: financialData.assets.map(inv => ({ ...inv, value: `₹${inv.value.toLocaleString('en-IN')}` })),
    detailedLiabilities: financialData.liabilities.map(inv => ({ ...inv, value: `₹${inv.value.toLocaleString('en-IN')}` })),
    }, null, 2);
}
