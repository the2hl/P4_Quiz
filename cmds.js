// Importaciones
const Sequelize = require("sequelize");
const {log, biglog, errorlog, colorize} = require("./out");
const {models} = require("./model");

/**
 * Mostrar la ayuda.
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.helpCmd = (socket, rl) => {
	log(socket, "Comandos:");
	log(socket, "  h|help - Mostrar esta ayuda.");
	log(socket, "  list - Listar todos los quizzes existentes.");
	log(socket, "  show <id> - Mostrar la pregunta y la respuesta del quiz indicado.");
	log(socket, "  add - Anadir un nuevo quiz.");
	log(socket, "  delete <id> - Borrar el quiz indicado.");
	log(socket, "  edit <id> - Editar el quiz indicado.");
	log(socket, "  test <id> - Probar el quiz indicado.");
	log(socket, "  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
	log(socket, "  credits - Créditos.");
	log(socket, "  q|quit - Salir del programa");
	rl.prompt();
};

/**
 * Lista todos los quizzes existentes en el modelo.
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.listCmd = (socket, rl) => {
	models.quiz.findAll()
	.each(quiz =>{
		log(socket, `[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
	})
	.catch(error=>{
		errorlog(error.message);
	})
	.then(()=>{
		rl.prompt();
	});
};

/**
 * Esta funcion devuelve una promesa que:
 *  - Valida que se ha introducido un valor para el parametro
 *  - Convierte el parametro en un numero entero.
 * Si todo va bien, la promesa se satisface y devuelve el valor de id a usar
 * @param id Parametro con el indice a validar.
 */
 const validateId = id => {
 	return new Sequelize.Promise((resolve, reject) =>{
 		if(typeof id === "undefined"){
 			reject(new Error(`Falta el parametro <id>.`));
 		} else {
 			id = parseInt(id); // coger la parte entera y descartar lo demas
 			if (Number.isNaN(id)){
 				reject(new Error(`El valor del parametro <id> no es un número.`));
 			} else {
 				resolve(id);
 			}
 		}
 	})
 };

/**
 * Muestra el quiz indicado en el parametro: la pregunta y la respuesta.
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a mostrar.
 */
exports.showCmd = (socket, rl,id) => {
	validateId(id)
	.then(id=>models.quiz.findById(id))
	.then(quiz=>{
		if(!quiz){
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		log(socket, `[${colorize(id, "magenta")}]: ${quiz.question} ${colorize("=>","magenta")} ${quiz.answer}`);
	})
	.catch(error=>{
		errorlog(socket, error.message);
	})
	.then(()=>{
		rl.prompt();
	});
};

/**
 * Esta funcion devuelve una promesa que cuando se cumple, proporciona el texto introducido.
 * Entonces la llamada a then que hay que hacer la promesa devuelta sera:
 * 		.then(answer=>{...})
 * Tambien colorea en rojo el texto de la pregunta, elimina espacios al principio y final
 * @param rl 	Objeto readline usado para implementar el CLI.
 * @param text 	Pregunta que hay que hacerle al usuario.
 */
const makeQuestion = (rl, text)=>{
	return new Sequelize.Promise((resolve,reject)=>{
		rl.question(colorize(text,'red'),answer=>{
			resolve(answer.trim());
		});
	});
};
/**
 * Anade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.addCmd = (socket, rl) => {
	makeQuestion(rl, 'Introduzca la pregunta: ')
	.then(q=>{
		return makeQuestion(rl, 'Introduzca la respuesta: ')
		.then(a=>{
			return {question: q, answer: a};
		});
	})
	.then(quiz=>{
		return models.quiz.create(quiz);
	})
	.then(quiz=>{
		log(socket, `${colorize("Se ha añadido", "magenta")}: ${quiz.question} ${colorize("=>", "magenta")} ${quiz.answer}`);
	})
	.catch(Sequelize.ValidationError, error=>{
		errorlog(socket, 'El quiz es erroneo: ');
		error.errors.forEach(({message})=>errorlog(message));
	})
	.catch(error=>{
		errorlog(socket, error.message);
	})
	.then(()=>{
		rl.prompt();
	});
};

/**
 * Borra un quiz del modelo.
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a borrar.
 */
exports.deleteCmd = (socket, rl, id) => {
	validateId(id)
	.then(id=>models.quiz.destroy({where:{id}}))
	.catch(error=>{
		errorlog(socket, error.message);
	})
	.then(()=>{
		rl.prompt();
	});
};

/**
 * Edita un quiz del modelo.
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a editar.
 */
exports.editCmd = (socket, rl, id) => {
	validateId(id)
	.then(id=>models.quiz.findById(id))
	.then(quiz=>{
		if(!quiz){
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		process.stdout.isTTY && setTimeout(() => {socket.write(quiz.question)}, 0);
		return makeQuestion(rl, 'Introduzca la pregunta: ')
		.then(q=>{
			process.stdout.isTTY && setTimeout(() => {socket.write(quiz.answer)}, 0);
			return makeQuestion(rl, 'Introduzca la respuesta: ')
			.then(a=>{
				quiz.question=q;
				quiz.answer=a;
				return quiz;
			});
		});
	})
	.then(quiz =>{
		return quiz.save();
	})
	.then(quiz =>{
		log(socket, `Se ha cambiado el quiz ${colorize(id, "magenta")} por: ${quiz.question} ${colorize("=>", "magenta")} ${quiz.answer}`);

	})
	.catch(Sequelize.ValidationError, error=>{
		errorlog(socket, 'El quiz es erroneo: ');
		error.errors.forEach(({message})=>errorlog(socket, message));
	})
	.catch(error=>{
		errorlog(socket, error.message);
	})
	.then(()=>{
		rl.prompt();
	});	
};

/**
 * Prueba un quiz, es decir, hacer una pregunta del modelo a la que debemos contestar.
 * @param rl Objeto readline usado para implementar el CLI.
 * @param id Clave del quiz a probar.
 */
exports.testCmd = (socket, rl, id) => {
	validateId(id)
	.then(id=>models.quiz.findById(id))
	.then(quiz=>{
		if(!quiz){
			throw new Error(`No existe un quiz asociado al id=${id}.`);
		}
		return makeQuestion(rl, `${quiz.question}: `)
		.then(a=>{
			my_answer = a.toLowerCase().trim();
			right_answer = quiz.answer.toLowerCase().trim();
			log(socket, "Su respuesta es: ");
			if (my_answer === right_answer){
				log(socket, "Correcta", "green");
			}else{
				log(socket, "Incorrecta", "red");
			}
		});
	})
	.catch(Sequelize.ValidationError, error=>{
		errorlog(socket, 'El quiz es erroneo: ');
		error.errors.forEach(({message})=>errorlog(socket, message));
	})
	.catch(error=>{
		errorlog(socket, error.message);
	})
	.then(()=>{
		rl.prompt();
	});	
};

/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.playCmd = (socket, rl) => {
	let score = 0;
	// array con los ids de las preguntas por contestar
	let toBeResolved = [];
	models.quiz.findAll()
	.each(quiz =>{
		toBeResolved.push(quiz.id);
	})
	.then(()=>{	
			function playOne(){
				if (toBeResolved.length == 0){
					log(socket, "No hay nada más que preguntar.");
					log(socket, "Fin del examen. Aciertos:");
					log(socket, score, "magenta");
					rl.prompt();
				} 
				else {
					// posicion al azar del array con ids
					let id_random = Math.floor(Math.random()*toBeResolved.length);
					indice = toBeResolved.splice(id_random, 1);
					validateId(indice)
					.then(id=>models.quiz.findById(id))
					.then(quiz=>{
						if(!quiz){
							throw new Error(`No existe un quiz asociado al id=${indice}.`);
						}
						return makeQuestion(rl, `${quiz.question}: `)
						.then(a=>{
							my_answer = a.toLowerCase().trim();
							right_answer = quiz.answer.toLowerCase().trim();
							if (my_answer === right_answer){
								score++;
								log(socket, `CORRECTO - Lleva ${score} aciertos.`, "green");
								playOne();
							}else{
								log(socket, "INCORRECTO.", "red");
								log(socket, "Fin del examen. Aciertos:");
								log(socket, score, "red");
								rl.prompt();
							}
						});
					})
				}
			}
			playOne();
		}
	)
	.catch(Sequelize.ValidationError, error=>{
		errorlog(socket, 'El quiz es erroneo: ');
		error.errors.forEach(({message})=>errorlog(message));
	})
	.catch(error=>{
		errorlog(error.message);
	})
	.then(()=>{
		rl.prompt();
	});
};

/**
 * Muestra los nombres de los autores de la practica.
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.creditsCmd = (socket, rl) => {
	log(socket, "Autor de la practica:");
	log(socket, "Hans Huaita Loyola", "green");
	log(socket, "Usuario de github: the2hl", "green");
	rl.prompt();
};

/**
 * Termina el programa.
 * @param rl Objeto readline usado para implementar el CLI.
 */
exports.quitCmd = (socket, rl) => {
	rl.close();
	socket.end();
};