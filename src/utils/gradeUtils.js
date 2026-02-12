/**
 * Calculates the Iraqi civil service job grade and current year within that grade.
 * 
 * Logic:
 * 1. Bachelor's (بكالوريوس) starts at Grade 7.
 * 2. Diploma (دبلوم) starts at Grade 8.
 * 
 * Promotion Intervals:
 * - Grade 8 to 7: 1 year (for Diploma)
 * - Grade 7 to 6: 4 years
 * - Grade 6 to 5: 4 years
 * - Grade 5 and above: 5 years per grade
 * 
 * @param {string} certificate - The employee's education level.
 * @param {number} totalYears - Total years of service.
 * @returns {object} { grade: number, year: number, display: string }
 */
export function calculateJobGrade(certificate, totalYears, courseSettings) {
  if (!certificate || totalYears < 0) {
    return { grade: null, year: null, display: 'غير محدد' };
  }

  const getRequirement = (grade) => {
    return courseSettings?.[`grade_${grade}`] ?? (grade === 8 ? 1 : 2);
  };

  // 1. Determine Starting Grade
  let startingGrade;
  const cert = (certificate || '').toLowerCase();
  if (cert.includes('دكتوراه')) {
    startingGrade = 5;
  } else if (cert.includes('ماجستير')) {
    startingGrade = 6;
  } else if (cert.includes('بكالوريوس')) {
    startingGrade = 7;
  } else if (cert.includes('دبلوم')) {
    startingGrade = 8;
  } else {
    startingGrade = 8; // Default
  }

  let currentGrade = startingGrade;
  let remainingYears = totalYears;

  // 2. Promotion Loop
  while (remainingYears > 0) {
    let yearsRequired;

    if (currentGrade === 8) {
      yearsRequired = 1;
    } else if (currentGrade === 7 || currentGrade === 6) {
      yearsRequired = 4;
    } else {
      // Grade 5, 4, 3, 2, 1
      yearsRequired = 5;
    }

    if (remainingYears >= yearsRequired) {
      if (currentGrade > 1) { // Cap at Grade 1
        remainingYears -= yearsRequired;
        currentGrade -= 1;
      } else {
        // Already at Grade 1, just keep adding years
        break;
      }
    } else {
      // Not enough years to promote
      break;
    }
  }

  // 3. Courses Required for CURRENT Grade Only
  const coursesRequired = getRequirement(currentGrade);

  // The total years used to reach the current grade
  // Total Years - Remaining Years = Years consumed by previous promotions
  const yearsOfServiceUsedForPromotion = totalYears - remainingYears;

  // The 'year' is the year within the current grade (1-indexed)
  // Example: 0 years remain -> Year 1 (start of grade)
  const yearInGrade = remainingYears + 1;

  const arabicGrades = {
    1: 'الأولى',
    2: 'الثانية',
    3: 'الثالثة',
    4: 'الرابعة',
    5: 'الخامسة',
    6: 'السادسة',
    7: 'السابعة',
    8: 'الثامنة',
    9: 'التاسعة',
    10: 'العاشرة'
  };

  const arabicYears = {
    1: 'الأولى',
    2: 'الثانية',
    3: 'الثالثة',
    4: 'الرابعة',
    5: 'الخامسة',
    6: 'السادسة'
  };

  const display = `الدرجة ${arabicGrades[currentGrade] || currentGrade} - السنة ${arabicYears[Math.floor(yearInGrade)] || Math.floor(yearInGrade)}`;

  return {
    grade: currentGrade,
    year: yearInGrade,
    coursesRequired, // Only for this specific grade
    yearsOfServiceUsedForPromotion, // To calculate start date of current grade
    display
  };
}
