/**
 * Calculates the total number of courses, weighting them based on duration.
 * Default logic: 2-week courses count as 2.
 * 
 * @param {Array} courses - Array of course objects from database.
 * @param {Object} settings - course_settings object from system settings.
 * @returns {number} The total weighted count.
 */
export function countWeightedCourses(courses, settings) {
    if (!courses || !Array.isArray(courses)) return 0;

    const weight = settings?.two_week_weight || 2;

    return courses.reduce((total, course) => {
        // If duration suggests a two-week course, apply weight
        // Match "أسبوعين" or "اسبوعين"
        if (course.duration && /[أا]سبوعين/.test(course.duration)) {
            return total + weight;
        }
        return total + 1;
    }, 0);
}
