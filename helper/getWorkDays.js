const moment = require('moment');

const getWorkdaysInRange = (startDate, endDate) => {
  const days = [];
  let current = moment(startDate).startOf('day');
  const end = moment(endDate).endOf('day');
  while (current.isSameOrBefore(end)) {
    const dow = current.day(); // 0=Min, 6=Sab
    if (dow !== 0 && dow !== 6) {
      days.push(current.format('YYYY-MM-DD'));
    }
    current.add(1, 'day');
  }
  return days;
};

module.exports = {
  getWorkdaysInRange
}