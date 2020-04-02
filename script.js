var sWidth = document.documentElement.clientWidth;
var zoomLevel;
if(sWidth >= 1024)		zoomLevel = 5;
else if(sWidth >= 768)	zoomLevel = 4;
else 					zoomLevel = 3;

var map = L.map('map').setView([-2.5, 118], zoomLevel);
L.tileLayer(
'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a> | Made by Zzombiee2361. <a href="https://github.com/Zzombiee2361/peta-covid">Source Code</a>',
	maxZoom: 18,
}).addTo(map);

function loadData() {
	Swal.fire({
		title: 'Mohon tunggu',
		html: 'Sedang memuat data',
		allowOutsideClick: false,
		allowEscapeKey: false,
		onBeforeOpen: function() {
			Swal.showLoading();
		}
	});
	$.when(
		$.getJSON('indonesia-prov.geojson'),
		$.getJSON('https://api.kawalcorona.com/indonesia/provinsi/'),
		$.getJSON('https://api.kawalcorona.com/indonesia/')
	).then(function(json, data, total) {
		// ===== Process API data =====
		var provinsi = [];
		data[0].forEach((d) => {
			d = d.attributes;
			provinsi[d.Kode_Provi] = d;
		});

		// ===== Map colors =====
		var colors = ['#ffffcc','#ffeda0','#fed976','#feb24c','#fd8d3c','#fc4e2a','#e31a1c','#bd0026','#800026'];
		var scales = [1, 5, 10, 20, 40, 80, 150, 300, 600];
		function getColor(n) {
			for (var i = scales.length-1; i >= 0; i--) {
				if(n >= scales[i]) {
					return colors[i];
				}
			}
		}

		function style(prov) {
			var kasus = (provinsi[prov.id] ? provinsi[prov.id].Kasus_Posi : 0);
			return {
				fillColor: getColor(kasus),
				weight: 2,
				opacity: 1,
				color: 'white',
				dashArray: '3',
				fillOpacity: (kasus > 0 ? 0.7 : 0)
			};
		}

		// ===== Event listener =====
		// mousein event
		function highlightFeature(e) {
			var layer = e.target;

			layer.setStyle({
				weight: 5,
				color: '#666',
				dashArray: '',
				fillOpacity: 0.7
			});

			if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
				layer.bringToFront();
			}

			info.update(layer.feature.properties);
		}

		// mouseout event
		function resetHighlight(e) {
			geojson.resetStyle(e.target);
			info.update();
		}

		// click event
		function zoomToFeature(e) {
			map.fitBounds(e.target.getBounds());
			info.update(e.target.feature.properties);
		}

		// attach event
		function onEachFeature(feature, layer) {
			layer.on({
				mouseover: highlightFeature,
				mouseout: resetHighlight,
				click: zoomToFeature
			});
		}

		// ===== Info panel =====
		var info = L.control();

		info.onAdd = function (map) {
			this._div = L.DomUtil.create('div', 'info');
			this.update();
			return this._div;
		};

		info.update = function (props) {
			var data = (props && provinsi[props.kode] ? provinsi[props.kode] : {});
			this._div.innerHTML = '<h4>Penyebaran Kasus COVID-19</h4>' +
				(props ?
				'<b>' + props.Propinsi + '</b>'+
				'<br />' + (data.Kasus_Posi || 0) + ' Positif'+
				'<br />' + (data.Kasus_Semb || 0) + ' Sembuh'+
				'<br />' + (data.Kasus_Meni || 0) + ' Meninggal'
				: '<b>Total</b>'+
				'<br />' + (total[0][0].positif || 0) + ' Positif'+
				'<br />' + (total[0][0].sembuh || 0) + ' Sembuh'+
				'<br />' + (total[0][0].meninggal || 0) + ' Meninggal');
		};

		info.addTo(map);

		// ===== Legend panel =====
		var legend = L.control({position: 'bottomright'});

		legend.onAdd = function (map) {

			var div = L.DomUtil.create('div', 'info legend');

			for (var i = 0; i < scales.length; i++) {
				div.innerHTML +=
					'<i style="background:' + colors[i] + '"></i> ' +
					scales[i] + (scales[i + 1] ? '&ndash;' + scales[i + 1] + '<br>' : '+');
			}

			return div;
		};

		legend.addTo(map);

		var geojson = L.geoJson(json, {
			style: style,
			onEachFeature: onEachFeature,
		}).addTo(map);
		Swal.close();
	}, function(data) {
		console.log(data);
		Swal.fire({
			icon: 'error',
			title: 'Ups!',
			text: 'Terjadi kesalahan saat memuat data',
			confirmButtonText: 'Coba Lagi',
			allowOutsideClick: false,
			allowEscapeKey: false,
		}).then(() => {
			loadData();
		});
	});
}

loadData();
