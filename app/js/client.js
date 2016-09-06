var app1 = angular.module('app1', ['smart-table']);

app1.controller('mainController', function($scope, $http){
	
	$scope.searchWeather = function(){
	    
	    if ($scope.country == null){
	        $scope.country = "HongKong";
	    }
	    
		var url = "https://weather-edwaaard.c9users.io/api/weather/" + $scope.country;

		$http.get(url)
        .success(function(response) {
            console.log("response" + response);
            $scope.returnn = response.list;
            $scope.currentcountry = response.city.country;
        })
        
            .error(function(data) {
                console.log('Error: ' + data);
        });
		
	}
	
});
