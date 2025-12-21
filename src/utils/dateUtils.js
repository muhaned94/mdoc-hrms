export const calculateServiceDuration = (hireDateArg, bonusMonths = 0) => {
    if (!hireDateArg) return { years: 0, months: 0, display: '0 سنة', totalMonths: 0, yearsDecimal: 0 }
    
    const hireDate = new Date(hireDateArg)
    const today = new Date()
    
    let years = today.getFullYear() - hireDate.getFullYear()
    let months = today.getMonth() - hireDate.getMonth()
    
    if (months < 0) {
        years--
        months += 12
    }

    // Add bonus months
    let totalMonths = (years * 12) + months + (bonusMonths || 0)
    let finalYears = Math.floor(totalMonths / 12)
    let finalMonths = totalMonths % 12
    let yearsDecimal = totalMonths / 12
    
    // Construct display string
    let display = ''
    if (finalYears > 0) display += `${finalYears} سنة`
    if (finalYears > 0 && finalMonths > 0) display += ' و '
    if (finalMonths > 0) display += `${finalMonths} شهر`
    if (display === '') display = 'أقل من شهر'
    
    return { 
        years: finalYears, 
        months: finalMonths, 
        display, 
        totalMonths,
        yearsDecimal
    }
}

export const formatDate = (dateArg) => {
    if (!dateArg) return '-'
    const date = new Date(dateArg)
    if (isNaN(date.getTime())) return '-'
    
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    
    return `${day}/${month}/${year}`
}

export const formatDateTime = (dateArg) => {
    if (!dateArg) return '-'
    const date = new Date(dateArg)
    if (isNaN(date.getTime())) return '-'

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    
    let hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const ampm = hours >= 12 ? 'م' : 'ص'
    hours = hours % 12
    hours = hours ? hours : 12 // the hour '0' should be '12'

    return `${day}/${month}/${year} - ${hours}:${minutes} ${ampm}`
}
