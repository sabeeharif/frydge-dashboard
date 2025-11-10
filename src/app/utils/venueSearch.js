"use client"

export const normalizeSearchValue = (value) => {
    if (value === undefined || value === null) {
        return ""
    }
    return value
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase()
}

export const getVenueSearchTokens = (venue) => {
    if (!venue) return []
    const candidates = [
        venue.name,
       
    ]
    const unique = new Set()
    const tokens = []
    for (const value of candidates) {
        const normalized = normalizeSearchValue(value)
        if (normalized && !unique.has(normalized)) {
            unique.add(normalized)
            tokens.push(normalized)
        }
    }
    return tokens
}

export const venueMatchesSearchTerm = (venue, normalizedTerm) => {
    if (!normalizedTerm) return true
    return getVenueSearchTokens(venue).some((token) => token.includes(normalizedTerm))
}

