var parseTargetOrigin = function(targetOrigin){
	// visualise this regex at http://regexper.com/#%2F(%5B%5E%3A%5D%2B)%5C%3A%5C%2F%5C%2F(.%2B%3F)(%3F%3A%5C%3A(%5B0-9%5D%2B))%3F%24%2F
	var matches = /([^:]+)\:\/\/(.+?)(?:\:([0-9]+))?$/.exec(targetOrigin);
	return {
		scheme: matches[1],
		host: matches[2],
		port: matches[3]
	};
};

module.exports.parseTargetOrigin = parseTargetOrigin;