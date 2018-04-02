
const figlet = require('figlet');
const chalk = require('chalk');
//const net = require("net");

/**
 * Dar color a un string.
 * @param msg 			Es string al que hay que dar color.
 * @param color 		El color con el que pintar msg.
 * @returns {string} 	Devuelve el string msg con el color indicado.
 */
const colorize = (msg, color) => {
	if (typeof color !== "undefined"){
		msg = chalk[color].bold(msg);
	}
	return msg;
};

/**
 * Escribe un mensaje de log.
 * @param socket 	
 * @param msg	Texto a escribir.
 * @param color El color del texto.
 */ 
const log = (socket, msg, color) => {
	socket.write(colorize(msg, color)+"\n");
};

/**
 * Escribe un mensaje de log grande.
 * @param socket
 * @param msg 	Texto a escribir.
 * @param color El color del texto.
 */ 
const biglog = (socket, msg, color) => {
	log(socket, figlet.textSync(msg, {horizontalLayout: 'full'}), color);
};

/**
 * Escribe el mensaje de error emsg.
 * @param emsg Texto del mensaje de error.
 */ 
const errorlog = (socket, emsg) => {
	socket.write(`${colorize("Error", "red")}: ${colorize(colorize(emsg, "red"), "bgYellowBright")}\n`);
};

exports = module.exports = {
	colorize,
	log,
	biglog,
	errorlog,
};
