function simulationOn(c,d,a){var b=function(){$("#simulation").css("opacity",0).on("load",function(){_.defer(a)}).attr("src",sprintf("/board?conversationJid=%s&slideId=%s&showTools=true&showSlides=true&unique=true",c,d))};$(b);b()}function hide(c){$(c,$("#simulation").contents()).animate({opacity:0},500)}function flash(c,d){for(var a=0;3>a;a++)$(c,$("#simulation").contents()).animate({opacity:0},250).animate({opacity:1},250,function(){3==a&&d&&d()})}
function showClick(c){flash(c,function(){$(c,$("#simulation").contents()).click()})}function clearTools(){_.map("#thumbsColumn #toolsColumn #applicationMenuButton #slideControls .meters #masterFooter".split(" "),hide);_.delay(function(){$("#simulation").animate({opacity:1})},1E3)}function showTools(){_.map("#thumbsColumn #toolsColumn #applicationMenuButton #slideControls .meters #masterFooter".split(" "),highlight);_.delay(function(){$("#simulation").animate({opacity:1})},1E3)}
function highlight(c){$(c,$("#simulation").contents()).animate({opacity:1},500)}
function simulatedUsers(c){var d=$("#simulationPopulation").empty();_.each(_.sortBy(c,"name"),function(a){var b=$("<div />").addClass("simulatedUser").appendTo(d);switch(a.attention.label){case "leftwards":$("<span />").addClass("fa fa-arrow-left").appendTo(b);break;case "above":$("<span />").addClass("fa fa-arrow-up").appendTo(b);break;case "rightwards":$("<span />").addClass("fa fa-arrow-right").appendTo(b);break;case "below":$("<span />").addClass("fa fa-arrow-down").appendTo(b)}$("<span />").text(a.name).appendTo(b);$("<span />").text(a.activity.label).appendTo(b);
$("<span />").addClass("coord").text(a.claim.left).appendTo(b);$("<span />").addClass("coord").text(a.claim.top).appendTo(b);$("<span />").addClass("coord").text(a.claim.right).appendTo(b);$("<span />").addClass("coord").text(a.claim.bottom).appendTo(b);$("<span />").addClass("coord").text(a.history.length).appendTo(b)})};