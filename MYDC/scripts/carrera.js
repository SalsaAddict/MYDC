/// <reference path="typings/angularjs/angular.d.ts" />
"use strict";
var Carrera;
(function (Carrera) {
    "use strict";
    (function (ParameterType) {
        ParameterType[ParameterType["route"] = 0] = "route";
        ParameterType[ParameterType["scope"] = 1] = "scope";
        ParameterType[ParameterType["value"] = 2] = "value";
    })(Carrera.ParameterType || (Carrera.ParameterType = {}));
    var ParameterType = Carrera.ParameterType;
    (function (RunType) {
        RunType[RunType["manual"] = 0] = "manual";
        RunType[RunType["auto"] = 1] = "auto";
        RunType[RunType["once"] = 2] = "once";
    })(Carrera.RunType || (Carrera.RunType = {}));
    var RunType = Carrera.RunType;
    (function (ModelType) {
        ModelType[ModelType["array"] = 0] = "array";
        ModelType[ModelType["singleton"] = 1] = "singleton";
        ModelType[ModelType["object"] = 2] = "object";
    })(Carrera.ModelType || (Carrera.ModelType = {}));
    var ModelType = Carrera.ModelType;
    var Parameter = (function () {
        function Parameter(name, type, value, required) {
            if (required === void 0) { required = false; }
            this.name = name;
            this.type = (type) ? type : ((value) ? ParameterType.value : ParameterType.route);
            this.value = (value) ? value : ((this.type === ParameterType.route) ? name : null);
            this.required = required;
        }
        return Parameter;
    })();
    Carrera.Parameter = Parameter;
    var Procedure = (function () {
        function Procedure(name, runType, model, modelType, objectRoot) {
            var _this = this;
            if (runType === void 0) { runType = RunType.manual; }
            this.parameters = [];
            this.empty = function () { return (_this.model) ? ((_this.modelType === ModelType.array) ? [] : {}) : undefined; };
            this.name = name;
            this.runType = runType;
            this.model = (model) ? model : undefined;
            this.modelType = (model) ? ((modelType) ? modelType : ((objectRoot) ? ModelType.object : ModelType.array)) : undefined;
            this.objectRoot = (this.modelType === ModelType.object) ? ((this.objectRoot) ? objectRoot : undefined) : undefined;
        }
        return Procedure;
    })();
    Carrera.Procedure = Procedure;
    var Controllers;
    (function (Controllers) {
        "use strict";
        var Main = (function () {
            function Main($scope, $parse) {
                var _this = this;
                this.$scope = $scope;
                this.$parse = $parse;
                this.addProcedure = function (procedure, alias) {
                    _this.$scope.procedures[alias || procedure.name] = procedure;
                    if (procedure.model) {
                        _this.$parse(procedure.model).assign(_this.$scope.$parent, procedure.empty());
                    }
                };
                this.removeProcedure = function (nameOrAlias) {
                    if (angular.isDefined(_this.$scope.procedures[nameOrAlias])) {
                        var procedure = _this.$scope.procedures[nameOrAlias];
                        if (procedure.model) {
                            _this.$parse(procedure.model).assign(_this.$scope.$parent, undefined);
                        }
                        delete _this.$scope.procedures[nameOrAlias];
                    }
                };
                this.$scope.procedures = {};
            }
            Main.$inject = ["$scope", "$parse"];
            return Main;
        })();
        Controllers.Main = Main;
        var Procedure = (function () {
            function Procedure($scope) {
                var _this = this;
                this.$scope = $scope;
                this.addParameter = function (parameter) {
                    _this.$scope.procedure.parameters.push(parameter);
                };
                this.removeParameter = function (parameter) {
                    var index = _this.$scope.procedure.parameters.indexOf(parameter);
                    if (index >= 0) {
                        _this.$scope.procedure.parameters.splice(index, 1);
                    }
                };
                this.$scope.procedure = new Carrera.Procedure(this.$scope.name, Carrera.RunType[angular.lowercase(this.$scope.runType)], this.$scope.model, Carrera.ModelType[angular.lowercase(this.$scope.modelType)], this.$scope.objectRoot);
            }
            Procedure.$inject = ["$scope"];
            return Procedure;
        })();
        Controllers.Procedure = Procedure;
        var Parameter = (function () {
            function Parameter($scope) {
                this.$scope = $scope;
                this.$scope.parameter = new Carrera.Parameter($scope.name, Carrera.ParameterType[angular.lowercase($scope.type)], $scope.value, (angular.lowercase($scope.required) === "true"));
            }
            Parameter.$inject = ["$scope"];
            return Parameter;
        })();
        Controllers.Parameter = Parameter;
    })(Controllers = Carrera.Controllers || (Carrera.Controllers = {}));
})(Carrera || (Carrera = {}));
var car = angular.module("carrera", ["templates/carreraTransclude.html"]);
car.directive("car", ["$log", function ($log) {
        return {
            restrict: "E",
            templateUrl: "templates/carreraTransclude.html",
            transclude: true,
            scope: {},
            controller: Carrera.Controllers.Main,
            link: function ($scope) {
                $scope.$watchCollection("procedures", function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        $log.debug(JSON.stringify($scope.procedures));
                    }
                });
            }
        };
    }]);
car.directive("carProc", ["$log", function ($log) {
        return {
            restrict: "E",
            templateUrl: "templates/carreraTransclude.html",
            transclude: true,
            scope: {
                name: "@",
                alias: "@",
                runType: "@run",
                model: "@",
                modelType: "@type",
                objectRoot: "@root"
            },
            controller: Carrera.Controllers.Procedure,
            require: "^^car",
            link: function ($scope, iElement, iAttrs, controller) {
                controller.addProcedure($scope.procedure, $scope.alias);
                $scope.$on("$destroy", function () {
                    controller.removeProcedure($scope.alias || $scope.procedure.name);
                });
            }
        };
    }]);
car.directive("carParam", ["$log", function ($log) {
        return {
            restrict: "E",
            templateUrl: "templates/carreraTransclude.html",
            transclude: true,
            scope: { name: "@", type: "@", value: "@", required: "@" },
            controller: Carrera.Controllers.Parameter,
            require: "^^carProc",
            link: function ($scope, iElement, iAttrs, controller) {
                controller.addParameter($scope.parameter);
                $scope.$on("$destroy", function () {
                    controller.removeParameter($scope.parameter);
                });
            }
        };
    }]);
angular.module("templates/carreraTransclude.html", [])
    .run(["$templateCache", function ($templateCache) {
        $templateCache.put("templates/carreraTransclude.html", "<ng-transclude></ng-transclude>");
    }]);
//# sourceMappingURL=carrera.js.map