!function(a){"use strict";function b(){var a=window.FlowCarousel,b=function(b,c,d){a.AbstractRenderer.call(this),this._scope=b,this._template=c,this._itemName=d};return b.prototype=Object.create(a.AbstractRenderer.prototype),b.prototype.renderItem=function(b,c,e){var f,g,h=new a.Deferred,i=this._scope.$new();return i[this._itemName]=e,i.$outer=i.$parent.$parent,f=d(this._template),g=f(i),h.resolve(g),h.promise()},b.prototype.renderPlaceholder=function(a,b){return $("<div>loading #"+b+"</div>")[0]},b}function c(){this._carousel=null,this._scope=null,this._itemName=null}var d=null;return c.prototype.compile=function(a,b){"undefined"!=typeof b.data&&(this._template=this._extractTemplate(a),a.empty())},c.prototype.link=function(a,c,d){var e,f=window.FlowCarousel,g={dataSource:null};if("function"!=typeof f)throw new Error('FlowCarousel is not loaded or registered under window, please add "window.FlowCarousel = FlowCarousel;"');if(this._scope=a,this._itemName=a.item||"item","object"==typeof a.config)for(e in a.config)g[e]=a.config[e];if("object"==typeof a.data&&"number"==typeof a.data.length?g.dataSource=new f.ArrayDataSource(a.data):a.data instanceof f.AbstractDataSource&&(g.dataSource=a.data),null!==g.dataSource){var h=b();g.renderer=new h(a,this._template,this._itemName)}this._carousel=new f,this._carousel.addListener(f.Event.LOADED_ITEMS,function(){this._angularApply()}.bind(this)),this._carousel.init(c,g),"string"==typeof d.data&&this._scope.$watch("$parent."+d.data+".length",function(a,b){a!==b&&(console.log("change",a,b),this._carousel.redraw())}.bind(this))},c.prototype._extractTemplate=function(a){return a.html().replace(/^\s+|\s+$/g,"")},c.prototype._angularApply=function(a){var b=this._scope.$root.$$phase;"$apply"==b||"$digest"==b?"function"==typeof a&&a():this._scope.$apply(a)},a.module("FlowCarousel",[]).directive("flowCarousel",function(){return{restrict:"EA",scope:{data:"=",config:"=",item:"@"},compile:function(a,b){var d=new c;return d.compile(a,b),function(a,b,c){d.link(a,b,c)}}}}).run(["$compile",function(a){d=a}]),c}(window.angular);
//# sourceMappingURL=FlowCarouselDirective.js.map