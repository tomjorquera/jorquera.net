// ensure that the page will degrade gracefully when no js
$('body').addClass('js-enabled');
$('body').removeClass('js-disabled');

function SwarmControl(canvas, buffer) {

    var that = this;

    SwarmControl.prototype.start = function() {

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.getContext('2d').fillStyle = 'white';
        canvas.getContext('2d').fillRect(0, 0, canvas.width , canvas.height);

        buffer.width = window.innerWidth;
        buffer.height = window.innerHeight;
        buffer.getContext('2d').fillStyle = 'white';
        buffer.getContext('2d').fillRect(0, 0, buffer.width , buffer.height);

        canvas.style.display="block";
        canvas.style.opacity=1;
        canvas.filter = "alpha(opacity=100);" /* For IE8 and earlier */

        // FPS monitoring
        var FPSbound = 15;
        var timeUnderFPSBound = 0;
        var fps = {
            startTime : 0,
            frameNumber : 0,
            getFPS : function(){
                this.frameNumber++;
                var d = new Date().getTime(),
                currentTime = ( d - this.startTime ) / 1000,
                result = Math.floor( ( this.frameNumber / currentTime ) );

                if( currentTime > 1 ){
                    this.startTime = new Date().getTime();
                    this.frameNumber = 0;
                }

                // update time under FPS bound
                if(result >= FPSbound) {
                    timeUnderFPSBound = 0;
                } else {
                    timeUnderFPSBound++;
                }
                return result;

            }
        };

        var timer;
        var swarm = new Swarm(canvas, buffer);

        var step = function(){
            swarm.step();

            //check FPS
            fps.getFPS();
            if (timeUnderFPSBound >= 500) {
                // not enough performances, better stop
                that.stop(timer);
            }
        }

        timer = setInterval(step, 50);

        SwarmUI.inactive();
    }

    SwarmControl.prototype.stop = function(timer) {
        clearInterval(timer);
        canvas.style.display="none";
        canvas.style.opacity=0;
        canvas.filter = "alpha(opacity=0);" /* For IE8 and earlier */
        SwarmUI.error();
    }
}

function SwarmUI() {

    var isActive = false;
    var error = false;

    SwarmUI.prototype.inactive = function() {
        isActive = false;
        error = false;

        $(".main").removeClass('moved');
        $("#back").removeClass('moved');

        $(".bg-button").removeClass('moved');
        $(".bg-button").removeClass('sec-button');
        $(".bg-button").attr("onclick","SwarmUI.toggleActive();");
        $(".info-button").removeClass('moved');
        $(".info-button").removeClass('sec-button');
        $(".info-button").attr("onclick","$('#boids-info').toggle();");
        $(".error-button").removeClass('moved');
        $(".error-button").attr("onclick","");
        $(".reload-button").removeClass('moved');
        $(".reload-button").attr("onclick","");

        if($('#boids-error').is(":visible")){
            $('#boids-error').hide();
            $('#boids-info').show();
        }
    }

    SwarmUI.prototype.active = function() {
        isActive = true;
        error = false;

        $(".main").addClass('moved');
        $("#back").addClass('moved');

        $(".bg-button").addClass('moved');
        $(".bg-button").removeClass('sec-button');
        $(".bg-button").attr("onclick","SwarmUI.toggleActive();");
        $(".info-button").addClass('moved');
        $(".info-button").removeClass('sec-button');
        $(".info-button").attr("onclick","$('#boids-info').toggle();");
        $(".error-button").removeClass('moved');
        $(".error-button").attr("onclick","");
        $(".reload-button").removeClass('moved');
        $(".reload-button").attr("onclick","");

        if($('#boids-error').is(":visible")){
            $('#boids-error').hide();
            $('#boids-info').show();
        }
    }

    SwarmUI.prototype.error = function() {
        isActive = false;
        error = true;

        $(".main").removeClass('moved');
        $("#back").removeClass('moved');

        $(".bg-button").removeClass('moved');
        $(".bg-button").addClass('sec-button');
        $(".bg-button").attr("onclick","");
        $(".info-button").removeClass('moved');
        $(".info-button").addClass('sec-button');
        $(".info-button").attr("onclick","");
        $(".error-button").addClass('moved');
        $(".error-button").attr("onclick","$('#boids-error').toggle();");
        $(".reload-button").addClass('moved');
        $(".reload-button").attr("onclick","SwarmControl.start();");

        if($('#boids-info').is(":visible")){
            $('#boids-info').hide();
            $('#boids-error').show();
        } else {
            $('#boids-error').hide();
        }
    }

    SwarmUI.prototype.toggleActive = function() {
        isActive ? this.inactive() : this.active();
    }

    SwarmUI.prototype.toggleError = function() {
        error ? this.inactive() : this.error();
    }
}

var SwarmControl;
var SwarmUI;

$(document).ready( function() {

    // Some Javascript for better tabs

    // Show the tab corresponding with the hash in the URL, or the first tab.
    var showTabFromHash = function() {
        var hash = window.location.hash;
        var selector = hash ? 'a[href="' + hash + '"]' : 'li.active > a';
        $(selector).tab('show');
    }
    // Set the correct tab when the page loads
    showTabFromHash();
    window.scrollTo(0, 0);

    // Set the correct tab when a user uses their back/forward button
    window.addEventListener('hashchange', showTabFromHash, false);

    // Change the URL when tabs are clicked
    $('#mainTab a').on('click', function(e) {
        history.pushState(null, null, this.href);
    });

    // we create a canvas and a buffer (better performances)
    var canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.getContext('2d').fillStyle = 'white';
    canvas.getContext('2d').fillRect(0, 0, canvas.width , canvas.height);
    document.getElementById("back").appendChild(canvas);

    var buffer = document.createElement('canvas');

    SwarmUI = new SwarmUI();
    SwarmControl = new SwarmControl(canvas, buffer);
    //let's rock!
    SwarmControl.start();

});
