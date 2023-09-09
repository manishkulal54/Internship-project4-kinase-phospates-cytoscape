const graphContainer = document.getElementById("graphContainer")
const fileAcceptor = document.getElementById("fileAcceptor")
const convertBtn = document.getElementById("convertBtn")
const changeClr = document.getElementById("changeClr")
const changeSize = document.getElementById("changeSize")
const changeFontSize = document.getElementById("changeFontSize")
const changeRootName = document.getElementById("changeRootName")


let fileUrl = ""
let svgFileName; //to save the svg in this filename
let sheetIndex = 0

let rootSize = 50
let boxSize = 15
let siteRadius = 1
let svgSize = 5

let pathClr = "#595A6E"
let UDDUClr = "#15e523"
let UUDDClr = "#0000ff"
let KinaseClr = "#ffa500"
let PhosphataseClr = "#00ffff"
let rootClr = "purple"


const colors = {
    pathClr: "#595A6E",
    UDDUClr: "#15e523",
    UUDDClr: "#0000ff",
    KinaseClr: "#ffa500",
    PhosphataseClr: "#00ffff",
    rootClr: "purple",

}

const fontSizes = {
    rootFontSize: 20,
    codeFontSize: 15,
    geneFontSize: 10,
    siteFontSize: 10
}
let frequencyArr = []
let rootText = "root"

function defaultValueLoader() { // to set the initial value in the input placeholder
    document.getElementById("clrInpt1").value = "#595A6E"
    document.getElementById("clrInpt2").value = "#15e523"
    document.getElementById("clrInpt3").value = "#0000ff"
    document.getElementById("clrInpt4").value = "#ffa500"
    document.getElementById("clrInpt5").value = "#00ffff"

    document.getElementById("number1").value = 50
    document.getElementById("number2").value = 15
    document.getElementById("number3").value = 1
    document.getElementById("number4").value = 5

    document.getElementById("fsize1").value = 20
    document.getElementById("fsize2").value = 15
    document.getElementById("fsize3").value = 10
    document.getElementById("fsize4").value = 10
}
defaultValueLoader()



convertBtn.addEventListener("click", (e) => { //fetching the file metadata from the user file selection
    e.preventDefault()
    const fileInputBtn = document.getElementById("fileInputBtn")
    sheetIndex = document.getElementById("sheetIndexInpt").value - 1

    if (sheetIndex < 0) {
        return alert("Sheet number starts from 1 or above!!!!")
    }
    const file = fileInputBtn.files[0]
    if (!file) {
        return fileInputBtn.click()
    }
    svgFileName = file.name.split(".")[0]
    const acceptedFormat = ["xlsx", "xls"]
    const fileExtension = file.name.split(".").pop()

    if (acceptedFormat.includes(fileExtension.toLowerCase())) {
        fileUrl = URL.createObjectURL(file)
        fileAcceptor.style.display = "none"
        graphContainer.style.display = "block"
        fetchFileData(fileUrl, sheetIndex)

    } else {
        alert("Select only excel file")
        window.location.reload()
    }
})

changeClr.addEventListener("click", (e) => {
    e.preventDefault()
    colors.pathClr = document.getElementById("clrInpt1").value || "#595A6E"
    colors.UDDUClr = document.getElementById("clrInpt2").value || "#15e523"
    colors.UUDDClr = document.getElementById("clrInpt3").value || "#0000ff"
    colors.KinaseClr = document.getElementById("clrInpt4").value || "#ffa500"
    colors.PhosphataseClr = document.getElementById("clrInpt5").value || "#00ffff"

    document.getElementById("chart").innerHTML = ""
    fetchFileData(fileUrl, sheetIndex)

})


changeSize.addEventListener("click", (e) => {
    e.preventDefault()
    rootSize = parseInt(document.getElementById("number1").value)
    boxSize = parseInt(document.getElementById("number2").value)
    siteRadius = parseInt(document.getElementById("number3").value)
    svgSize = parseInt(document.getElementById("number4").value)

    if (rootSize < 1 || boxSize < 1 || siteRadius < 1 || svgSize < 1) {
        return alert("Size value must be more than zero !!!!")
    }

    document.getElementById("chart").innerHTML = ""
    fetchFileData(fileUrl, sheetIndex)

})

changeFontSize.addEventListener("click", (e) => {
    e.preventDefault()
    fontSizes.rootFontSize = parseInt(document.getElementById("fsize1").value) || 20
    fontSizes.codeFontSize = parseInt(document.getElementById("fsize2").value) || 15
    fontSizes.geneFontSize = parseInt(document.getElementById("fsize3").value) || 10
    fontSizes.siteFontSize = parseInt(document.getElementById("fsize4").value) || 10

    document.getElementById("chart").innerHTML = ""
    fetchFileData(fileUrl, sheetIndex)

})
changeRootName.addEventListener("click", e => {
    e.preventDefault()
    rootText = document.getElementById("rootInput").value || "root"
    document.getElementById("chart").innerHTML = ""
    fetchFileData(fileUrl, sheetIndex)

})


// fetchFileData("K+P data.xlsx", 0)
function fetchFileData(fileUrl, sheetIndex) { //fetch the data from the spreadsheet and preprocess the data for the chart 
    fetch(fileUrl)
        .then(res => res.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(data, { type: "array" })
            const sheetName = workbook.SheetNames[sheetIndex]
            if (!sheetName) {
                alert("There is no sheet found using this sheet number try again")
                window.location.reload()
            }
            const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])

            const root = {
                name: rootText,
                children: [],
                code: "root"
            };

            const kp_Map = new Map() //container for the kinase and phosphate
            const indexObj = {} // container for the index of kp
            let index = 0
            sheetData.forEach(row => {
                let codeArr = row.Code.split("+");
                let code = codeArr[0];
                let kp = codeArr[1];
                if (!kp_Map.has(kp)) {
                    const kpNode = {
                        name: kp,
                        children: [],
                        code
                    }
                    kp_Map.set(kp, kpNode)
                    root.children.push(kpNode)
                    indexObj[kp] = index;
                    index++
                }
            })
            const geneObj = {} // container for the genes
            sheetData.forEach(row => {
                let codeArr = row.Code.split("+");
                let code = codeArr[0];
                let kp = codeArr[1];
                let geneName = row.Genes;
                const kpNode = kp_Map.get(kp)
                if (!(`${kp}-${geneName}` in geneObj)) {
                    geneObj[`${kp}-${geneName}`] = true //storing as kp-genname:true
                    const geneNode = {
                        name: geneName,
                        children: [],
                        code
                    }
                    kpNode.children.push(geneNode)
                }
            })
            let sitesObj = {} //container for the sites
            sheetData.forEach(row => {
                let codeArr = row.Code.split("+");
                let code = codeArr[0];
                let kp = codeArr[1];
                let geneName = row.Genes;
                let siteName = row.Sites;
                let frequency = row.Frequency;

                root.children[indexObj[kp]].children.forEach(gn => {
                    if (gn.name === geneName) {
                        if (!(`${kp}-${geneName}-${siteName}-${code}` in sitesObj)) {
                            sitesObj[`${kp}-${geneName}-${siteName}-${code}`] = true
                            const siteNode = {
                                name: siteName,
                                code,
                                frequency
                            }
                            gn.children.push(siteNode)
                            frequencyArr.push(frequency)
                        }
                    }
                })
            })
            drawChart(root)

        })
        .catch(err => {
            console.error("Error Found !!!", err);
            alert("Error found :", " Check your input file with names (genes,sites,code,Frequency) also match the case")
        })
}

//handle the creation of the chart
function drawChart(data) { 
    const width = 1200;
    const cx = width * 0.5
    const radius = width / 2 - 50 * svgSize;// reduce the size by multiple of 50

    //selecting the svg with id name chart
    const svg = d3
        .select("#chart") 
        .attr("viewBox", [-cx, -cx, width, width]) //!!
        .style("border", "2px solid red")
        .attr("style", "width:100vw;height:auto;")

    const tree = d3
        .tree()
        .size([2 * Math.PI, radius]) //defining use 360deg and radius for diameter of chart
        .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth)

    const root = tree(d3 //creating the data into a tree structured data
        .hierarchy(data)
        .sort((a, b) => d3.ascending(a.data.name, b.data.name))
    )

    // plotting lines 
    svg
        .append("g")
        .attr("fill", "none")
        .attr("stroke", colors.pathClr)
        .attr("stroke-opacity", 1)
        .attr("stroke-width", 0.75)
        .selectAll()
        .data(root.links())
        .join("path")
        .attr("d", d3.linkRadial()
            .angle(d => d.x)
            .radius(d => {
                if (d.depth === 3 && !d.children) {
                    return d.y + 40 + (d.data.frequency / Math.min(...frequencyArr)) * siteRadius
                }
                return d.y
            }))


    //plotting rectangles(box) and circles 
    svg
        .append("g")
        .selectAll()
        .data(root.descendants())
        .join(function (e) {
            const node = e.append("g")

            node.filter(d => d.children) //partitoning the nodes which has chidren nodes and drawing rectangle
                .append("rect")
                .attr("x", d => d.depth === 0 ? -(rootSize / 2) : -15)
                .attr("y", d => d.depth === 0 ? -(rootSize / 2) : 0 - (boxSize / 2))
                .attr("width", d => d.depth === 0 ? rootSize : boxSize)
                .attr("height", d => d.depth === 0 ? rootSize : boxSize)
                .attr("fill", d => boxClr(d))

            node.filter(d => !d.children)//partitoning the nodes as leaf node and drawing rectangle
                .append("circle")
                .attr("r", d => d.data.frequency / Math.min(...frequencyArr) * siteRadius)
                .attr("fill", d => colorForSites(d))
                .call(d3.drag()
                    .on("start", dragStarted)
                    .on("drag", draggingCircle)
                    .on("end", dragEnded)
                )
            return node
        })
        .attr("transform", d => alignShapes(d))
        .attr("stroke", "black")
        .attr("stroke-width", 0.75)


    //dragging functions 
    function dragStarted() {
        d3.select(this).raise().classed("active", true);
    }
    function draggingCircle(d) { //drag controls
        console.log(d.y, d3.event.y);
        d3.select(this) //adjust the values as required
            .attr("transform", `rotate(${90}) translate(${d.x >= Math.PI ? d3.event.y - (600 - 50 * svgSize) : d3.event.y - (600 - 50 * svgSize)},${-d3.event.x})`)
    }
    function dragEnded() {
        d3.select(this).classed("active", false);
    }

    //alligning rectangles and circles based on their depth,x, y
    function alignShapes(d) {
        if (d.depth === 0) {
            return `rotate(0) translate(${d.y},0)`
        }
        else if (d.depth === 1) {
            return `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y + 10},0)`
        }
        else if (d.depth === 2) {
            return `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y + 15},0)`
        }
        else if (d.depth === 3) {
            return `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y + 20},0)`
        }

    }

    // giving color based on the kinase or phosphate
    function boxClr(d) {
        if (d.data.code == "root") {
            return colors.rootClr
        }
        if (d.data.name === "Kinase" || d.parent.data.name === "Kinase") {
            return colors.KinaseClr
        }
        else if ((d.data.name === "Phosphatase" || d.parent.data.name === "Phosphatase")) {
            return colors.PhosphataseClr
        }
    }

    // giving color to the site based on the code 
    function colorForSites(d) {
        let color = ""
        if (d.data.code == "UUDD") {
            color = colors.UUDDClr
        }
        else if (d.data.code == "UDDU") {
            color = colors.UDDUClr
        }
        return color;
    }


    // adding text to each nodes
    svg
        .append("g")
        .selectAll()
        .data(root.descendants())
        .join("text")
        .attr("transform", d => alignText(d))
        .style("font-size", d => fontSize(d))
        .style("font-weight", "bold")
        .attr("dy", "0.1em")
        .text(d => d.data.name)
        .attr("fill", d => textClrGen(d))


    // aligning the text position 
    function alignText(d) {
        if (d.depth === 0) { //root text
            return `rotate(${10})
                    translate(${d.x - (rootSize / 2)},${d.y})
                    `
        }
        else if (d.depth === 1 && d.children) { // kp text
            return `rotate(${d.x * 180 / Math.PI - 90})
                    translate(${d.x >= Math.PI ? (d.y) : (d.y)},${d.x >= Math.PI ? 5 : -5}) 
                    rotate(${d.x >= Math.PI ? 90 : -90})
                    `
        }
        else if (d.depth === 2 && d.children) { //protiens text
            return `rotate(${d.x * 180 / Math.PI - 90})
                translate(${d.x >= Math.PI ? (d.y + boxSize + 40) : (d.y + boxSize + 5)},0) 
                rotate(${d.x >= Math.PI ? 180 : 0})
            `
        }
        else if (d.depth === 3 && !d.children) { //site text
            if (d.data.code === "UDDU") { 
                return `rotate(${d.x * 180 / Math.PI - 90})
                translate(${d.x >= Math.PI ? (d.y + 15 - ((d.data.frequency / Math.min(...frequencyArr)) * siteRadius)) : (d.y - 10 - (d.data.frequency / Math.min(...frequencyArr) * siteRadius))},
                ${d.x >= Math.PI ? -2 : 2}) 
                rotate(${d.x >= Math.PI ? 180 : 0})
            `
            } else if (d.data.code === "UUDD") {
                return `rotate(${d.x * 180 / Math.PI - 90})
                translate(${d.x >= Math.PI ? (d.y + (d.data.frequency / Math.min(...frequencyArr) * siteRadius) + 50) : (d.y + (d.data.frequency / Math.min(...frequencyArr) * siteRadius)) + 30},
                ${d.x >= Math.PI ? -2 : 2}) 
                rotate(${d.x >= Math.PI ? 180 : 0})
            `
            }
        }
    }

    //handling the font size based on depth and input by user
    function fontSize(d) {
        if (d.depth === 0) {
            return fontSizes.rootFontSize
        }
        else if (d.depth === 1 && d.children) {
            return fontSizes.codeFontSize
        }
        else if (d.depth === 2 && d.children) {
            return fontSizes.geneFontSize
        }
        else if (d.depth === 3 && !d.children) {
            return fontSizes.siteFontSize
        }
    }

    //color for text if the gene has more than one kinase than it gives red color else gives black
    function textClrGen(d) {
        if (d.depth == 2 && d.children) {
            let clrFound = {
                color1: false,
                color2: false
            }
            d.data.children.forEach(e => {
                console.log(e.code, e.name);
                if (e.code === "UDDU") {
                    clrFound.color1 = true
                }
                else if (e.code === "UUDD") {
                    clrFound.color2 = true
                }
            })
            if (clrFound.color1 == true && clrFound.color2 == true) {
                return "red"
            }
        }
        return "black"
    }

}

// downloading the svg graph
const svgElement = document.querySelector("#chart");
const downloadButton = document.querySelector("#downloadButton");

//converting the chart into svg
downloadButton.addEventListener("click", () => {
    const svgContent = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = svgFileName
    link.click();
});

//handling the edit button
const editingBtns = document.getElementById("editingBtns")

editingBtns.onclick = () => {
    const editBtn = document.getElementById("editBtn")
    const closeBtn = document.getElementById("closeBtn")
    const optionsContainer = document.getElementById("optionsContainer")
    if (editBtn.style.display !== "none") {
        editBtn.style.display = "none"
        closeBtn.style.display = "flex"
        optionsContainer.style.display = "flex"
    } else {
        editBtn.style.display = "flex"
        closeBtn.style.display = "none"
        optionsContainer.style.display = "none"
    }
}