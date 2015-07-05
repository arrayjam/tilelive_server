Map { 
  background-color: #050505;
}

@sans_bold: 'Open Sans Extrabold';

#road {
  line-color: #2f2f2f;
  line-opacity: 0.5;
  line-width: 0.2;
  [zoom>=13] {
    line-opacity: 1;
    line-width: 0.75;
  }
  [zoom>=15] { line-width: 1; }
  [zoom>=16] {
    line-width: 2;
    [roadclass=0] {
      line-width: 1;
    }
  }
  [zoom>=17] { line-width: 3; }
  [zoom>=18] { line-width: 6; }

}

@text-size: 15;

#suburb {
  text-name: [SSC_NAME];
  text-face-name: @sans_bold;
  text-placement: interior;
  text-fill: #fcff49;
  text-halo-fill: black;
  text-halo-radius: 1.5;
  text-halo-opacity: 1;
//  text-min-padding: 1;
  text-margin: 5;
  text-size: @text-size;
  
  [SSC_NAME=~'^.{10,}$'] {
    text-size: @text-size * 0.8;
  }
  [SSC_NAME=~'^.{14,}$'] {
    text-size: @text-size * 0.6;
  }
}

#roof {
  [zoom>=17] {
    building-height: [ROOF_HT];
    building-fill: #303030;
    building-fill-opacity: 0.8;

    [const_yr>=1800] { building-fill: #d0cb35; }
    [const_yr>=1850] { building-fill: #ff6855; }
    [const_yr>=1900] { building-fill: #7f3eaf; }
    [const_yr>=1905] { building-fill: #6d3fa9; }
    [const_yr>=1910] { building-fill: #6848b8; }
    [const_yr>=1915] { building-fill: #6152c5; }
    [const_yr>=1920] { building-fill: #595dd0; }
    [const_yr>=1925] { building-fill: #5069d8; }
    [const_yr>=1930] { building-fill: #4676de; }
    [const_yr>=1935] { building-fill: #3c83e1; }
    [const_yr>=1940] { building-fill: #3291e0; }
    [const_yr>=1945] { building-fill: #299fdd; }
    [const_yr>=1950] { building-fill: #22add6; }
    [const_yr>=1955] { building-fill: #1cbacd; }
    [const_yr>=1965] { building-fill: #19c7c1; }
    [const_yr>=1970] { building-fill: #19d2b4; }
    [const_yr>=1975] { building-fill: #1cdca6; }
    [const_yr>=1980] { building-fill: #22e596; }
    [const_yr>=1985] { building-fill: #2bec87; }
    [const_yr>=1990] { building-fill: #38f179; }
    [const_yr>=1995] { building-fill: #47f46d; }
    [const_yr>=2000] { building-fill: #59f663; }
    [const_yr>=2005] { building-fill: #6df65b; }
    [const_yr>=2010] { building-fill: #82f557; }
  }
  
  [zoom<17] {
    polygon-fill: #303030;
    polygon-opacity: 1;

    [const_yr>=1800] { polygon-fill: #d0cb35; }
    [const_yr>=1850] { polygon-fill: #ff6855; }
    [const_yr>=1900] { polygon-fill: #7f3eaf; }
    [const_yr>=1905] { polygon-fill: #6d3fa9; }
    [const_yr>=1910] { polygon-fill: #6848b8; }
    [const_yr>=1915] { polygon-fill: #6152c5; }
    [const_yr>=1920] { polygon-fill: #595dd0; }
    [const_yr>=1925] { polygon-fill: #5069d8; }
    [const_yr>=1930] { polygon-fill: #4676de; }
    [const_yr>=1935] { polygon-fill: #3c83e1; }
    [const_yr>=1940] { polygon-fill: #3291e0; }
    [const_yr>=1945] { polygon-fill: #299fdd; }
    [const_yr>=1950] { polygon-fill: #22add6; }
    [const_yr>=1955] { polygon-fill: #1cbacd; }
    [const_yr>=1965] { polygon-fill: #19c7c1; }
    [const_yr>=1970] { polygon-fill: #19d2b4; }
    [const_yr>=1975] { polygon-fill: #1cdca6; }
    [const_yr>=1980] { polygon-fill: #22e596; }
    [const_yr>=1985] { polygon-fill: #2bec87; }
    [const_yr>=1990] { polygon-fill: #38f179; }
    [const_yr>=1995] { polygon-fill: #47f46d; }
    [const_yr>=2000] { polygon-fill: #59f663; }
    [const_yr>=2005] { polygon-fill: #6df65b; }
    [const_yr>=2010] { polygon-fill: #82f557; }
    }
}