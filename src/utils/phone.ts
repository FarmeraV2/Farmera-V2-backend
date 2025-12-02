export function toLocalPhone(phone: string, countryCode: string = "+84"): string {
    if (!phone) return phone;

    if (phone.startsWith("+")) {
        return phone;
    }

    const cc = countryCode.replace("+", "");

    if (phone.startsWith(cc)) {
        return "0" + phone.slice(cc.length);
    }

    return phone;
}

export function toInternationalPhone(phone: string, countryCode: string = "+84"): string {
    if (!phone) return phone;

    let cleaned = phone.replace(/\D/g, "");

    if (cleaned.startsWith(countryCode.replace("+", ""))) {
        return countryCode + cleaned.slice(countryCode.length - 1);
    }

    if (cleaned.startsWith("0")) {
        cleaned = cleaned.slice(1);
    }

    return `${countryCode}${cleaned}`;
}
