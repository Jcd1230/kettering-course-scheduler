if not io.open("catalog.txt") then
	io.popen("wget -O catalog.pdf http://www.kettering.edu/sites/default/files/resource-file-download/2014-2015UndergraduateCatalog_4.pdf"):close()
	io.popen("pdftotext catalog.pdf catalog.txt")
end

local lpeg = require("lpeg")

local majors = {
	--{"LIBERAL STUDIES"},
	{"APPLIED BIOLOGY"},
	{"APPLIED MATHEMATICS"},
	{"APPLIED PHYSICS"},
	{"BIOCHEMISTRY"},
	{"BIOINFORMATICS"},
	{"BUSINESS ADMINISTRATION"},
	{"CHEMICAL ENGINEER"},
	{"CHEMISTRY"},
	{"COMPUTER ENGINEERING"},
	{"COMPUTER SCIENCE"}, 
	{"ELECTRICAL ENGINEERING"},
	{"ENGINEERING PHYSICS"},
	{"INDUSTRIAL ENGINEERING"},
	{"MECHANICAL ENGINEERING"}
}

local fullcat = io.open("catalog.txt"):read("*a")

local _, s = fullcat:find("ACADEMIC PROGRAM INFORMATION")
local e, s2 = fullcat:find("COURSE DESCRIPTIONS")
local e2, _ = fullcat:find("BOARD OF TRUSTEES")
local catalog = fullcat:sub(s, e-1)
local descriptions = fullcat:sub(s2, e2-1)
local descriptions = descriptions:sub(descriptions:find("SAMPLE COURSE DESCRIPTION") + 50, -1)
io.open("desc.txt","w"):write(descriptions)
local current_course
local courses = {}
for line in descriptions:gmatch("[^\r\n]+") do
	--print(line)
	local abbr, num, name = line:match("^([A-Z]+)%-([0-9]+)[ L]*([A-Z][^\r\n]+)")
	--print(abbr,num,name)
	if abbr and num and name then
		if name:match("Lab%s*$") or name:match("Laboratory%s*$") then
			num = num .. "L"
			print("Found lab")
		end
		courses[abbr] = courses[abbr] or {}
		courses[abbr][num] = courses[abbr][num] or {}
		current_course = courses[abbr][num]
		current_course.name = name
	end
end

for ab, v in pairs(courses) do
	for num, c in pairs(v) do
		--print(ab, num)
		print("('"..ab.."', '"..num.."', '"..c.name.."'),")
	end
end



for k,v in pairs(majors) do
	local s, e = catalog:find(v[1])
	if not s then
		print("COULD NOT FIND MAJOR", k, v)
	else
		majors[k].s = s
	end
end
table.insert(majors, #majors+1, {s = -1 })

for i,v in ipairs(majors) do
	if majors[i+1] then
	v.text = catalog:sub(v.s, majors[i+1].s-1)
	end
end

