export const toNumber = (value) => {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  if (typeof value === 'string') {
    const num = parseFloat(value.replace(/[^0-9.-]+/g, ''));
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

export const safeSum = (...args) => {
  return args.reduce((sum, val) => sum + toNumber(val), 0);
};

export const formatMoney = (value, currencySymbol = 'RS', locale = 'en-IN') => {
  const num = toNumber(value);
  const options = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };
  return `${currencySymbol} ${num.toLocaleString(locale, options)}`;
};