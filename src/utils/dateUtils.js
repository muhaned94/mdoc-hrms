export const calculateServiceDuration = (hireDateArg) => {
    if (!hireDateArg) return { years: 0, months: 0, display: '0 سنة' }
    
    const hireDate = new Date(hireDateArg)
    const today = new Date()
    
    let years = today.getFullYear() - hireDate.getFullYear()
    let months = today.getMonth() - hireDate.getMonth()
    
    if (months < 0) {
        years--
        months += 12
    }
    
    // Construct display string
    let display = ''
    if (years > 0) display += `${years} سنة`
    if (years > 0 && months > 0) display += ' و '
    if (months > 0) display += `${months} شهر`
    if (display === '') display = 'أقل من شهر'
    
    return { years, months, display }
}
