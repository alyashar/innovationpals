const express = require('express');
module.exports = {
	ManageLog : function(err)
	{
		var fs = require('fs');
		var util = require('util');
		var now = new Date();
		var logfile_name = './LOG/' + now.getFullYear() + "-"+ (now.getMonth()+1) + "-" + now.getDate() +'.txt'
		var logFile = fs.createWriteStream(logfile_name, { flags: 'a' });

		logFile.once('open', function(fd) {
		  logFile.write("\n#####   "+now+"   #####\n"+err+"\n#####\n");
		  logFile.end();
		});

		console.error = console.log;
	}
}
