import ballerina/http;

const string API_KEY = "03c6fe26d28762ee3bf72731b05307c7";
const string BASE_URL = "https://api.openweathermap.org/data/2.5";

listener http:Listener weatherListener = new (5503);

service /weather on weatherListener {

    resource function get update(http:Caller caller, http:Request req) returns error? {
        string? city = req.getQueryParamValue("city");

        if city is () {
            //check caller->respond({ error: "Query parameter 'city' is required" }, statusCode = 400);
            return;
        }

        http:Client openWeatherClient = check new (BASE_URL);

        // Fetch current weather
        string currentPath = "/weather?q=" + city + "&appid=" + API_KEY + "&units=metric";
        http:Response currentResponse = check openWeatherClient->get(currentPath);
        json currentData = check currentResponse.getJsonPayload();

        // Fetch 5-day forecast
        string forecastPath = "/forecast?q=" + city + "&appid=" + API_KEY + "&units=metric";
        http:Response forecastResponse = check openWeatherClient->get(forecastPath);
        json forecastData = check forecastResponse.getJsonPayload();

        // Combine the results
        json combined = {
            city: city,
            current: currentData,
            forecast: forecastData
        };

        check caller->respond(combined);
    }
}
