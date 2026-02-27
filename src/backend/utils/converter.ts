/**
 * Unit conversion logic — used by the HTMX /api/convert endpoint.
 */

type ConversionMap = Record<string, Record<string, number>>;

const LENGTH: ConversionMap = {
    meter: { meter: 1, kilometer: 0.001, mile: 0.000621371, foot: 3.28084, inch: 39.3701, centimeter: 100, yard: 1.09361 },
    kilometer: { meter: 1000, kilometer: 1, mile: 0.621371, foot: 3280.84, inch: 39370.1, centimeter: 100000, yard: 1093.61 },
    mile: { meter: 1609.34, kilometer: 1.60934, mile: 1, foot: 5280, inch: 63360, centimeter: 160934, yard: 1760 },
    foot: { meter: 0.3048, kilometer: 0.0003048, mile: 0.000189394, foot: 1, inch: 12, centimeter: 30.48, yard: 0.333333 },
    inch: { meter: 0.0254, kilometer: 0.0000254, mile: 0.0000157828, foot: 0.0833333, inch: 1, centimeter: 2.54, yard: 0.0277778 },
    centimeter: { meter: 0.01, kilometer: 0.00001, mile: 0.00000621371, foot: 0.0328084, inch: 0.393701, centimeter: 1, yard: 0.0109361 },
    yard: { meter: 0.9144, kilometer: 0.0009144, mile: 0.000568182, foot: 3, inch: 36, centimeter: 91.44, yard: 1 },
};

const WEIGHT: ConversionMap = {
    kilogram: { kilogram: 1, gram: 1000, pound: 2.20462, ounce: 35.274, ton: 0.001 },
    gram: { kilogram: 0.001, gram: 1, pound: 0.00220462, ounce: 0.035274, ton: 0.000001 },
    pound: { kilogram: 0.453592, gram: 453.592, pound: 1, ounce: 16, ton: 0.000453592 },
    ounce: { kilogram: 0.0283495, gram: 28.3495, pound: 0.0625, ounce: 1, ton: 0.0000283495 },
    ton: { kilogram: 1000, gram: 1000000, pound: 2204.62, ounce: 35274, ton: 1 },
};

const DATA: ConversionMap = {
    byte: { byte: 1, kilobyte: 0.001, megabyte: 0.000001, gigabyte: 1e-9, terabyte: 1e-12 },
    kilobyte: { byte: 1000, kilobyte: 1, megabyte: 0.001, gigabyte: 0.000001, terabyte: 1e-9 },
    megabyte: { byte: 1e6, kilobyte: 1000, megabyte: 1, gigabyte: 0.001, terabyte: 0.000001 },
    gigabyte: { byte: 1e9, kilobyte: 1e6, megabyte: 1000, gigabyte: 1, terabyte: 0.001 },
    terabyte: { byte: 1e12, kilobyte: 1e9, megabyte: 1e6, gigabyte: 1000, terabyte: 1 },
};

const SPEED: ConversionMap = {
    'm/s': { 'm/s': 1, 'km/h': 3.6, 'mph': 2.23694, 'knot': 1.94384 },
    'km/h': { 'm/s': 0.277778, 'km/h': 1, 'mph': 0.621371, 'knot': 0.539957 },
    'mph': { 'm/s': 0.44704, 'km/h': 1.60934, 'mph': 1, 'knot': 0.868976 },
    'knot': { 'm/s': 0.514444, 'km/h': 1.852, 'mph': 1.15078, 'knot': 1 },
};

const TIME: ConversionMap = {
    second: { second: 1, minute: 1 / 60, hour: 1 / 3600, day: 1 / 86400, week: 1 / 604800 },
    minute: { second: 60, minute: 1, hour: 1 / 60, day: 1 / 1440, week: 1 / 10080 },
    hour: { second: 3600, minute: 60, hour: 1, day: 1 / 24, week: 1 / 168 },
    day: { second: 86400, minute: 1440, hour: 24, day: 1, week: 1 / 7 },
    week: { second: 604800, minute: 10080, hour: 168, day: 7, week: 1 },
};

const CATEGORIES: Record<string, ConversionMap> = {
    length: LENGTH,
    weight: WEIGHT,
    data: DATA,
    speed: SPEED,
    time: TIME,
};

function convertTemperature(value: number, from: string, to: string): number {
    // Normalize to Celsius first
    let celsius: number;
    switch (from) {
        case 'celsius': celsius = value; break;
        case 'fahrenheit': celsius = (value - 32) * 5 / 9; break;
        case 'kelvin': celsius = value - 273.15; break;
        default: return NaN;
    }
    // Convert from Celsius to target
    switch (to) {
        case 'celsius': return celsius;
        case 'fahrenheit': return celsius * 9 / 5 + 32;
        case 'kelvin': return celsius + 273.15;
        default: return NaN;
    }
}

export function convert(value: number, fromUnit: string, toUnit: string, category: string): string {
    if (isNaN(value)) return '—';

    if (category === 'temperature') {
        const result = convertTemperature(value, fromUnit, toUnit);
        return isNaN(result) ? '—' : formatNumber(result);
    }

    const map = CATEGORIES[category];
    if (!map) return '—';

    const factor = map[fromUnit]?.[toUnit];
    if (factor === undefined) return '—';

    return formatNumber(value * factor);
}

function formatNumber(n: number): string {
    if (Math.abs(n) >= 1e9) return n.toExponential(4);
    if (Math.abs(n) < 0.0001 && n !== 0) return n.toExponential(4);
    // Use up to 6 significant digits
    return parseFloat(n.toPrecision(8)).toString();
}

export const UNIT_OPTIONS: Record<string, { value: string; label: string }[]> = {
    length: [
        { value: 'meter', label: 'Meter' },
        { value: 'kilometer', label: 'Kilometer' },
        { value: 'mile', label: 'Mile' },
        { value: 'foot', label: 'Foot' },
        { value: 'inch', label: 'Inch' },
        { value: 'centimeter', label: 'Centimeter' },
        { value: 'yard', label: 'Yard' },
    ],
    weight: [
        { value: 'kilogram', label: 'Kilogram' },
        { value: 'gram', label: 'Gram' },
        { value: 'pound', label: 'Pound' },
        { value: 'ounce', label: 'Ounce' },
        { value: 'ton', label: 'Metric Ton' },
    ],
    temperature: [
        { value: 'celsius', label: 'Celsius' },
        { value: 'fahrenheit', label: 'Fahrenheit' },
        { value: 'kelvin', label: 'Kelvin' },
    ],
    data: [
        { value: 'byte', label: 'Byte' },
        { value: 'kilobyte', label: 'Kilobyte' },
        { value: 'megabyte', label: 'Megabyte' },
        { value: 'gigabyte', label: 'Gigabyte' },
        { value: 'terabyte', label: 'Terabyte' },
    ],
    speed: [
        { value: 'm/s', label: 'm/s' },
        { value: 'km/h', label: 'km/h' },
        { value: 'mph', label: 'mph' },
        { value: 'knot', label: 'Knot' },
    ],
    time: [
        { value: 'second', label: 'Second' },
        { value: 'minute', label: 'Minute' },
        { value: 'hour', label: 'Hour' },
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week' },
    ],
};
