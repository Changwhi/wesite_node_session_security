

const database = include('databaseConnection');

async function createTodo(postData) {
	let createTodoSQL = `
		INSERT INTO todo
		(content, user_id)
		VALUES
		(:content, :user_id);
	`;

	let params = {
		user_id: postData.user_id,
		content: postData.content
	}
	
	try {
		const results = await database.query(createTodoSQL, params);

        console.log("Successfully created todo");
		console.log(results[0]);
		return true;
	}
	catch(err) {
		console.log("Error inserting user");
        console.log(err);
		return false;
	}
}

async function getTodo(postData) {
	let getTodoSQL = `
		SELECT content
		FROM todo
        where user_id = :user_id;
	`;
	
    let params = {
        user_id: postData.user_id
    }
	try {
		const results = await database.query(getTodoSQL, params);

        console.log("Successfully retrieved todo");
		console.log(results[0]);
		return results[0];
	}
	catch(err) {
		console.log("Error getting users");
        console.log(err);
		return false;
	}
}

module.exports = {createTodo, getTodo};