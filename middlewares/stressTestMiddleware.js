module.exports = (req, res, next) => {
    console.log('>>> STRESS_TEST value:', JSON.stringify(process.env.STRESS_TEST));
    console.log('>>> typeof:', typeof process.env.STRESS_TEST);

    if (process.env.STRESS_TEST.trim() === 'true') {
        const userId = parseInt(req.body?.userId) || 1;
        req.user = {
            id: userId,
            schoolId: 1,
            role: 'student',
            name: `User ${userId}`,
            class: 'XII RPL',
            photoUrl: null
        };
        console.log('>>> req.user set:', req.user);
    } else {
        console.log('>>> STRESS_TEST bukan true, req.user tidak di-set!');
    }

    next();
};