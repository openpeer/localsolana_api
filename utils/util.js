exports.randomNumber = function (length) {
	var text = "";
	var possible = "123456789";
	for (var i = 0; i < length; i++) {
		var sup = Math.floor(Math.random() * possible.length);
		text += i > 0 && sup == i ? "0" : possible.charAt(sup);
	}
	return Number(text);
};
exports.isOnline = function (
	timezone,
	availableFrom,
	availableTo,
	weekendOffline
  ) {
	if (timezone && availableFrom !== undefined && availableTo !== undefined) {
	  const now = new Date().toLocaleString("en-US", { timeZone: timezone });
	  const currentDate = new Date(now);
	  const day = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
	  const hour = currentDate.getHours();
	  if ((day === 6 || day === 0) && weekendOffline) {
		return false;
	  }
	  return hour >= availableFrom && hour <= availableTo;
	}
	return null;
  };