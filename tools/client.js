const axios = require('axios');
let dbquest = axios.create({
  baseURL: 'http://39.104.120.165:20628'
});

// query type range
dbquest.post('/airwaypoints', {
  type: 'range',
  params: {
    lon1: 1163500,
    lat1: 400400,
    lon2: 1163600,
    lat2: 400500
  }
})
.then(res => {
  console.log(res.data)
})



// query type radius
dbquest.post('/airwaypoints', {
  type: 'radius',
  params: {
    lon: 1163548,
    lat: 400418,
    radius: 3000
  }
})
.then(res => {
  console.log(res.data)
})