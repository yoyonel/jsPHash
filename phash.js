function imagePHash(image) {
	if (image.width < 50 && image.height < 50) {
		return null;
	}

	var start = new Date().getTime();
	var result = {
		imgUrl : image.src,
		pHash : "none",
		img : image
	}

	try {
		var size1 = 32;
		var imgW = size1;
		var imgH = size1;

		image.crossOrigin = "Anonymous";

		if (!image.canvas) {
			image.canvas = $('<canvas />')[0];
			image.canvas.width = imgW;
			image.canvas.height = image.height;
			image.canvas.getContext('2d').drawImage(image, 0, 0, imgW, imgH);
		}

		C = new Float64Array(size1);
		for (let i=0; i < size1; ++i) {
			C[i] = (i ?  1 : 1 / Math.sqrt(2.0))*0.5;
		}

		COS = new Float64Array(size1*size1);
		for (let uv = 0; uv < size1*size1; ++uv) {
			for (let ij = 0; ij < size1*size1; ++ij) {
				COS[ij + uv*size1] = Math.cos(((2 * ij + 1) / (2.0 * size1)) * uv * Math.PI);
			}
		}

		// FIXME alpha channel
		var imgPixels = image.canvas.getContext('2d').getImageData(0, 0, imgW, imgH);
		for (var u = 0, pixelIndex=0; u < imgH; u++) {
			for (var v = 0; v < imgW; v++, pixelIndex+=4) {
				// https://pillow.readthedocs.io/en/3.1.x/reference/Image.html
				// When translating a color image to black and white (mode “L”), the library uses the ITU-R 601-2 luma transform:
				// L = R * 299/1000 + G * 587/1000 + B * 114/1000
				imgPixels.data[pixelIndex] = 
					imgPixels.data[pixelIndex] * 299/1000 + 
					imgPixels.data[pixelIndex + 1] * 587/1000 + 
					imgPixels.data[pixelIndex + 2] * 114/1000;
			}
		}

		var dct = [];
		for (var u = 0, U=0; u < imgH; u++, U+=size1) {
			for (var v = 0, V=0; v < imgW; v++, V+=size1) {
				var sum = 0.0;
				for (var i = 0, pixelIndex2=0; i < size1; i++) {
					for (var j = 0; j < size1; j++, pixelIndex2+=4) {
						sum += COS[i + U] * COS[j + V] * imgPixels.data[pixelIndex2];
					}
				}
				sum *= C[u] * C[v];
				dct.push(sum);
			}
		}
		
		// 32x32 -> 8x8 + average
		var size2 = 8;
		var total = 0;
		for (var Y=0; Y < size1*size2; Y+=size1) {
			for (var x = 0; x < size2; x++) {
				total += dct[Y + x];
			}
		}
		var avg = total / (size2 * size2);

		var hash = "";
		for (var x = 0; x < size2; x++) {
			for (var y = 0; y < size2; y++) {
				if (x != 0 && y != 0) {
					var index = x * size2 + y;
					dct[index] > avg ? hash = hash + "1" : hash = hash + "0";
				}
			}
		}
		
		result.pHash = hash;
		console.assert(hash == '0100100010110011001101011100000110110011101011010', 'Problem de hash!')
	} catch (err) {
		console.log(err);
	}

	var end = new Date().getTime();
	console.log(image.src + " -> binary pHash: " + result.pHash + " ---> " + (end - start) + " ms");
	
	var intValue = parseInt(result.pHash, 2);
	
	console.log("hex pHash -> " + intValue.toString(16));


	return result;
}
