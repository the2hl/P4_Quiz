
const {log, biglog, errorlog, colorize} = require("./out");
const model = require("./model");

/**
 * Mostrar la ayuda.
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.helpCmd = rl => {
	log("Comandos:");
	log("  h|help - Mostrar esta ayuda.");
	log("  list - Listar todos los quizzes existentes.");
	log("  show <id> - Mostrar la pregunta y la respuesta del quiz indicado.");
	log("  add - Anadir un nuevo quiz.");
	log("  delete <id> - Borrar el quiz indicado.");
	log("  edit <id> - Editar el quiz indicado.");
	log("  test <id> - Probar el quiz indicado.");
	log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
	log("  credits - Créditos.");
	log("  q|quit - Salir del programa");
	rl.prompt();
};

/**
 * Lista todos los quizzes existentes en el modelo.
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.listCmd = rl => {
	model.getAll().forEach((quiz, id) => {
		log(`[${colorize(id, 'magenta')}]: ${quiz.question}`);
	});
	rl.prompt();
};

/**
 * Muestra el quiz indicado en el parametro: la pregunta y la respuesta.
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = (rl,id) => {
	if (typeof id === "undefined"){
		errorlog("Falta el parámetro id.");
	} else {
		try{
			const quiz = model.getByIndex(id);
			log(`[${colorize(id, "magenta")}]: ${quiz.question} ${colorize("=>","magenta")} ${quiz.answer}`);
		} catch(error) {
			errorlog(error.message);
		}
	}
	rl.prompt();
};

/**
 * Anade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.addCmd = rl => {
	rl.question(colorize("Introduzca una pregunta: ", "red"), question => {
		//callback: funcion question
		rl.question(colorize("Introduzca la respuesta: ", "red"), answer => {
			//callback: funcion answer
			model.add(question, answer);
			log(`${colorize("Se ha añadido", "magenta")}: ${question} ${colorize("=>", "magenta")} ${answer}`);
			rl.prompt(); // dentro por ser llamada asincrona
		});
	});
};

/**
 * Borra un quiz del modelo.
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a borrar.
 */
exports.deleteCmd = (rl, id) => {
	if (typeof id === "undefined"){
		errorlog("Falta el parámetro id.");
	} else {
		try{
			model.deleteByIndex(id);
		} catch(error) {
			errorlog(error.message);
		}
	}
	rl.prompt();
};

/**
 * Edita un quiz del modelo.
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a editar.
 */
exports.editCmd = (rl, id) => {
	if (typeof id === "undefined"){
		errorlog("Falta el parámetro id.");
		rl.prompt();
	} else {
		try{
			const quiz = model.getByIndex(id);
			process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
			rl.question(colorize("Introduzca una pregunta: ", "red"), question => {
				//callback de question: de aquí para abajo
				process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
				rl.question(colorize("Introduzca la respuesta: ", "red"), answer => {
				//callback de answer: de aquí para abajo
					model.update(id, question, answer);
					log(`Se ha cambiado el quiz ${colorize(id, "magenta")} por: ${question} ${colorize("=>", "magenta")} ${answer}`);
					rl.prompt(); // dentro por ser llamada asincrona
				});
			});
		} catch(error) {
			errorlog(error.message);
			rl.prompt(); // dentro por ser llamada asincrona
		}
	}
};

/**
 * Prueba un quiz, es decir, hacer una pregunta del modelo a la que debemos contestar.
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a probar.
 */
exports.testCmd = (rl, id) => {
	if (typeof id === "undefined"){
		errorlog("Falta el parámetro id.");
		rl.prompt(); // dentro por ser llamada asincrona
	} else {
		try{
			const quiz = model.getByIndex(id);
			rl.question(`${colorize(quiz.question, "red")}: `, answer => {
			//callback de answer: de aquí para abajo
				my_answer = answer.toLowerCase().trim();
				right_answer = quiz.answer.toLowerCase().trim();
				log("Su respuesta es: ");
				if (my_answer === right_answer){
					log("Correcta", "green");
				}else{
					log("Incorrecta", "red");
				}
				rl.prompt(); // dentro por ser llamada asincrona
			});
		} catch(error) {
			errorlog(error.message);
			rl.prompt(); // dentro por ser llamada asincrona
		}
	}
};

/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.playCmd = rl => {
	let score = 0;
	// array con los ids de las preguntas por contestar
	let toBeResolved = [];
	// meto los ids en el array
	for (var i=0; i<model.count() ; i++){
		toBeResolved.push(i);
	}
	const playOne = () =>{
		if (toBeResolved.length == 0){
			log("No hay nada más que preguntar.");
			log("Fin del examen. Aciertos:");
			biglog(score, "magenta");
			rl.prompt();
		} 
		else {
			// posicion al azar del array con ids
			let id_random = Math.floor(Math.random()*toBeResolved.length);
			indice = toBeResolved.splice(id_random, 1);
			let quiz = model.getByIndex(indice);
			rl.question(`${colorize(quiz.question, "red")}: `, answer => {
			//callback de answer: de aquí para abajo
				my_answer = answer.toLowerCase().trim();
				right_answer = quiz.answer.toLowerCase().trim();
				if (my_answer === right_answer){
					score++;
					log(`CORRECTO - Lleva ${score} aciertos.`);
					playOne();
				}else{
					log("INCORRECTO.");
					log("Fin del examen. Aciertos:");
					biglog(score, "magenta");
					rl.prompt();
				}
			});
		}
	}
	playOne();
};

/**
 * Muestra los nombres de los autores de la practica.
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.creditsCmd = rl => {
	log("Autor de la practica:");
	log("Hans Huaita Loyola", "green");
	log("Usuario de github: the2hl", "green");
	rl.prompt();
};

/**
 * Termina el programa.
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.quitCmd = rl => {
	rl.close();
};