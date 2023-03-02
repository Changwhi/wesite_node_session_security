
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function populateHTMLOnLoad() {
    console.log("ready!");

    $.ajax(
        {
            type: "GET",
            // data: {},
            //url: "/api",
            url: "/api",

            dataType: "json",
            success: async function (result, status, xhr) {
                console.log("AJAX success!");
                console.log(result);
                if (result.success === false) {
                    window.location.href = "/";
                }
                //unnecessary delay added because we want to see our spinner for longer! :P
                await sleep(2000);
                
                var htmlString = "";
                for (var i = 0; i < result.data.length; i++){
                
                    htmlString += "<div>"+result.data[i].content +"</div>";
                }
                // htmlString += "<form action='/createtodo' method='post'> <input name='todo' type='text'> <button>ADD</button></form>"
                // htmlString += "<form action='/loggedin' method='get'><button>Go back to main menu</button></form> <br>"
                
                $("#dynamic_content").html(htmlString);
            },
            error: function(xhr, status, error) {
                console.log("AJAX Error: "+status+" "+error+" "+xhr.status+" "+xhr.statusText);
                window.location.href = "/";
            }
        }
    )
}

$(populateHTMLOnLoad);  //equivalent to: $( document ).ready(populateHTMLOnLoad);