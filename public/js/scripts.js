/**
 * scripts.js
 *
 * Computer Science 50
 * Final Project - CS-50hz
 *
 * Global JavaScript.
 */

//needed to put these as global variables so that we can turn on and off head tracking
var tracking = false;

//update graph
function graph()
{
    var binnum = 1024; //number of bins to calculate
    var dispbin = 32; //Will display this number of bins - see manipulation function
    var maxfreq = 22050; //Frequency range is 0 to 22050khz due to default sampling rate of web audio api
    var multiplier = Math.pow(maxfreq, 1/dispbin); //This value gives what you need to multiply by at each bin step to reach 22khz considering dispbin
    var smoothing = 0.80; //smoothing rate 0.8 is default
    var binwidth = 0.95; //Width of bins or graph bars. 1 is full width, 0 is hidden
    var ctx; //object in graph to fill canvas
    
    //Add coulours for canvas gradient
    var colorStop1 = '#000000'; //Black for base of plot
    var colorStop2 = '#00FF00'; //Default green for center 
    var colorStop3 = '#FF0000'; //Red for top
    //Add crossover points for canvas gradient
    var crossover1 = 1;
    var crossover2 = 0.75;
    var crossover3 = 0.1;
    //variables to track head position
    var headx = 0;
    var heady = 0;

    createcanvas(); //Load canvas. Also load if window resised
    window.onresize = function() {createcanvas();};
    
    //Audio context required for any audio work. Creates and manages nodes
    var context = new AudioContext();
    
    //Audio analyser
    var analyser = context.createAnalyser();
        //Fourier transform size (Number of bins per channel?)
        analyser.fftSize = binnum * 2;
        //Smooth samples 0.8 is default
        analyser.smoothingTimeConstant = smoothing;
        //Make array to hold data with number of buckets (Array of 8bit integers)
    var frequencyData = new Uint8Array( analyser.fftSize );

    var mediaStreamSource;
        //get data from microphone
        navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
        navigator.getUserMedia(
            { audio: true }, 
            function( stream ) {
                mediaStreamSource = context.createMediaStreamSource( stream );
                //connect to analyser node
                mediaStreamSource.connect( analyser );
            }, 
            function( e ) {
                console.log( 'getUserMedia ' + e );
            }
        );
        
    update();

    //update plot
    function update() {
        
        requestAnimationFrame( update );
        //drop current audio stream into the frequency array
        analyser.getByteFrequencyData( frequencyData );
        
        var newfrequencyData = manipulate(frequencyData);
        
        ctx.clearRect( 0, 0, canvas.width, canvas.height );
        ctx.fillStyle=gradient;
        //For each bin, draw onto screen
        for( var i = 0; i < dispbin; i++ ) {
            //fill rectangle (top left X position, top left y position, width, height)
            ctx.fillRect( i * ( canvas.width / dispbin ), canvas.height, binwidth * canvas.width / dispbin, - newfrequencyData[ i ] * canvas.height / 255 );
        }
    }
    
    function manipulate(frequencyData){
        //Frequency range is 0 to 22050khz due to default sampling rate of web audio api
        var tempfrequencyData = new Uint8Array( dispbin ); //variable to hold data while being manipulated
        var binstart = 0;
        var binstop;
        //Select max frequency in each bucket. Buckets divided logarithmically based on frequency range and bucket count
        for( var i = 0; i < dispbin; i++ ) {
            binstop = Math.round(binstart * multiplier);
            if (binstop <=  binstart) { binstop++ } //Make sure it keeps moving if multiplier is too low
            var max = 0;
            //Select the highest frequency in these buckets to display
            for(var k = 0, l = (binstop - binstart); k < l; k++) {
                if (frequencyData[binstart + k] > max){
                    max = frequencyData[binstart + k];
                }
            }
            tempfrequencyData[i] = max;
            binstart = binstop;
        }
        return tempfrequencyData;
    }
    
    //Creates the canvas based on the window size. New gradient required and ctx updated
    function createcanvas(){
        canvas.width = document.documentElement.clientWidth * 0.99;
        canvas.height = document.documentElement.clientHeight * 0.96; //stops the scroll bar showing
        //get the context from the canvas to draw on
        ctx = $("#canvas").get()[0].getContext("2d");
        creategradient();
    }
    
    function creategradient(){
        //create a gradient for the fill
        gradient = ctx.createLinearGradient(0,0,0,canvas.height);
        gradient.addColorStop(crossover1, colorStop1);
        gradient.addColorStop(crossover2, colorStop2);
        gradient.addColorStop(crossover3, colorStop3);
    }
    
    //Set event listener - headtracking event is broadcast by headtrackr.js when updated
    //This code changes the colours based on head position
    document.addEventListener("headtrackingEvent",  function (evt){
        headx = Math.round(evt.x);
        heady = Math.round(evt.y);

        //If head is in reasonable range then change colour
        if(headx <= 30 & headx >= -30 & heady <= 30 & heady >= -30)
        {
            //make new colour
            //Convert to a digit between 0 and 255
            headx = (headx + 30) * 4;
            heady = (heady + 30) * 4;
            colorStop2 = 'rgb(0,' + heady + ',' + headx + ')'; //place in RGB array
            creategradient(); //update gradient
        }
    });
}

function head()
{       
        //head() is called from the head button. Initiates the headtrackr script
        //If already tracking then turn off, otherwise turn on
        if (tracking == false){
            //Create video element for headtracr.js (Not really required? Video not being displayed)
            var videoInput = document.createElement('video');
            videoInput.autoPlay = true;
            videoInput.id = "inputVideo";
        
            //Create canvas element for headtracr.js (Not required but easier than removing from code)
            var canvasInput = document.createElement('canvas');
            canvasInput.id = "inputCanvas";
            canvasInput.width = "320";
            canvasInput.height = "240";
            canvasInput.style = "display:none";
        
            //UI false stops printouts to the screen. Also disabled code in js file
            var htracker = new headtrackr.Tracker({ ui : false, detectionInterval : 200 });
            tracker = htracker;
            htracker.init(videoInput, canvasInput);
            htracker.start();
            
            //Change global variable to show tracking is on
            tracking = true;
            
            //Change button to say tracking is on
            document.getElementById("headbutton").innerHTML = "Head Banging off";
        }
        else{
            //stop tacking
            tracker.stop();
            //Change global variable to show tracking is on
            tracking = false;
            
            //Change button to say tracking is off
            document.getElementById("headbutton").innerHTML = "Head Bang";
        }
}


//toggle info on and off
$(document).ready(function() {
    $('#infobutton').click(function(event) {
        $('#info').toggle();
    });
});


//turn head tracking on
$(document).ready(function() {
    $('#headbutton').click(function(event) {
        head();
    });
});
