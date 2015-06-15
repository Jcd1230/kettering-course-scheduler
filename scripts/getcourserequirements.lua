if not io.open("catalog.txt") then
	io.popen("wget -O catalog.pdf http://www.kettering.edu/sites/default/files/resource-file-download/2014-2015UndergraduateCatalog_4.pdf"):close()
	io.popen("pdftotext catalog.pdf -layout catalog.txt")
end
local gprint = print
local lpeg = require("lpeg")

gprint([[
DELETE FROM sch.course;
DELETE FROM sch.program;
DELETE FROM sch.program_group;
DELETE FROM sch.program_group_course;
]])

local majors = {
	--{"LIBERAL STUDIES"}
	{"APPLIED BIOLOGY", "BIO"},
	{"APPLIED MATHEMATICS", "MATH"},
	{"APPLIED PHYSICS", "PHYS"},
	{"BIOCHEMISTRY", "BIOCHEM"},
	{"BIOINFORMATICS", "BIOINFO"},
	{"BUSINESS ADMINISTRATION", "BUSI"},
	{"CHEMICAL ENGINEERING", "CHEME"},
	{"CHEMISTRY", "CHEM"},
	{"COMPUTER ENGINEERING", "CE"},
	{"COMPUTER SCIENCE", "CS"}, 
	{"ELECTRICAL ENGINEERING", "EE"},
	{"ENGINEERING PHYSICS", "EP"},
	{"INDUSTRIAL ENGINEERING", "IE"},
	{"MECHANICAL ENGINEERING", "ME"}
}

local fullcat = io.open("catalog.txt"):read("*a")
fullcat = fullcat:gsub("–", "-")
fullcat = fullcat:gsub(" [%w ]+ / %d+","")

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
	local abbr, num, name, credits = line:match("^([A-Z]+)%-([0-9A-Z]+) *([ %w%&%:%.%-%/]-)%d%d%d.(%d).")

	-- Alternate form
	if not (abbr and num and name and credits) then
		
		abbr, num, name, credits = line:match("^([A-Z]+)%-([0-9A-Z]+) *([%w %-/]+)(%d)[ %d%-]*[cC]redits")
		if abbr then
			--print("ALTERNATE FORM", line)
		end
	end
	
	if abbr and num and name and credits then
		name = name:gsub("   +", "")
		--print(abbr,num,name,credits)
		courses[abbr] = courses[abbr] or {}
		if courses[abbr][num] then
			print(abbr,num)
			for k,v in pairs(courses[abbr][num]) do print(k,v) end
			print("New name", name)
			error("DUPLICATE CLASS")
		end
		courses[abbr][num] = courses[abbr][num] or {}
		current_course = courses[abbr][num]
		current_course.name = name
		current_course.credits = credits
	elseif line:find("^[A-Z]+%-[0-9A-Z]+ *[A-Z] +") then
		error("NO CREDITS".. line)
	end
end

local course_sql = {}
print([[INSERT INTO sch.course
( course_id, course_abbr, course_number, course_name, credits )
VALUES]])

local i = 0
for ab, v in pairs(courses) do
	for num, c in pairs(v) do
		c.id = i
		table.insert(course_sql, "(".. i ..",'".. ab.."', '"..num.."', '"..c.name.."', "..c.credits..")")
		i = i + 1
	end
end
i = 0
print(table.concat(course_sql, ",\n")..";")

for k,v in pairs(majors) do
	local s, e = catalog:find("[^%w]"..v[1])
	if not s then
		error("COULD NOT FIND MAJOR\t"..k.."\t"..v)
	else
		majors[k].s = s + 1
	end
end
table.insert(majors, #majors+1, {s = -1 })

for i,v in ipairs(majors) do
	if majors[i+1] then
	v.text = catalog:sub(v.s, majors[i+1].s-1):gsub("[%(%)]", "")
		:gsub("[\r\n][%w ]+/ %d+[\r\n]", "")
	end
end

for i,v in ipairs(majors) do
	if not v[1] then break end
	-- Convert MECHANICAL to Mechanical for all words in majors
	v[1] = v[1]:gsub("(%w+)", function(s) return (s:sub(1,1) .. s:sub(2):lower()) end)
	v[3] = i-1
	
	-- Get curriculum text
	local _, s = v.text:find("Program Curriculum Requirements", 1, true)
	local e, _ = v.text:find("Minimum Total Credits Required for Program", 1, true)
	if not (s and e) then 
		error("Could not find Program Curric for major ".. v[1]) 
	end
	v.fulltext = v.text
	v.text = v.text:sub(s+1, e-1)
	
end

-- Insert majors
gprint([[INSERT INTO sch.program
( program_id, program_name, abbreviation )
VALUES]])
local majors_sql = {}
local print_t = { majors_sql }
local print = function(...) for i,v in pairs({...}) do table.insert(print_t[1], v) end end
for i,v in pairs(majors) do
	if not v[1] then break end
	print(("( %d, '%s', '%s' )"):format(v[3], v[1], v[2]))
end

gprint(table.concat(majors_sql, ",\n")..";")

--local groups = {}

-- Get major requirements
for i,v in ipairs(majors) do
	-- v[3] = major primary key
	if not v[1] then break end
	local requirements = {}
	local lines = {}
	v.text = v.text:gsub(" +", " ")
	for line in v.text:gmatch("[^\r\n]+") do
		if line:find("^ ?And:") or line:find("^Plus") then
			table.insert(lines, "ALL")
		elseif line:find("^And one from:") 
		or line:find("^ ?One [Ff]rom:")
		or line:find("^ ?Choose one from:")
		or line:find("^ ?Choose from:") then
			table.insert(lines, "ANY")
		else--if line:find("^[A-Z]%+-[0-9A-Z/]+") then
			table.insert(lines, line)
		end
	end
	--gprint("MAJOR", v[1])
	v.groups = {}
	--gprint(table.concat(lines, "\n"))
	local curgroup
	for i,line in ipairs(lines) do
		if line == "ALL" then
			if curgroup.qty then
				table.insert(v.groups, curgroup)
				--gprint("Finished group ".. curgroup.name)
				local newgrp = {}
				newgrp.name = curgroup.name
				curgroup = newgrp
				curgroup.qty = -1
			else
				curgroup.qty = -1
			end
		elseif line == "ANY" then
			if curgroup.qty then
				table.insert(v.groups, curgroup)
				--gprint("Finished group ".. curgroup.name)
				local newgrp = {}
				newgrp.name = curgroup.name
				curgroup = newgrp
				curgroup.qty = 4
			else
				curgroup.qty = 4
			end
		elseif line:find("^Total %d+") then
			if curgroup and curgroup.courses then
				table.insert(v.groups, curgroup)
				--gprint("Finished group ".. curgroup.name)
			else
				--gprint("Threw away group ".. curgroup.name)
			end
			curgroup = nil
		elseif line:find("^ ") or line:find(" Electives") or line:find("^%*") then
			-- Ignore electives for now
		elseif line == "Any physics course that is not a core physics requirement listed above 4" then
			curgroup.courses = curgroup.courses or {}
			for k,v in pairs(courses["PHYS"]) do
				table.insert(curgroup.courses, v)
			end
		elseif line:find("^[A-Z]+%-? ?[%d/A-Z]+") then
			local abbr, num = line:match("^([A-Z]+)%-? ?([%-%d/A-Z]+)")
			local num2
			if type(num) == "string" and (num:find("[^a-zA-Z0-9]")) then
				num, num2 = num:match("(%d+).(%d+)")
				if not (num and num2) then
					gprint("COULD NOT MATCH TWO CLASSES")
				end
			end
			curgroup.courses = curgroup.courses or {}
			if not courses[abbr] then
				--gprint("MISSING CLASS",abbr,"-",num)
			else
				local proceed1, proceed2 = true, true
				for i,v in ipairs(curgroup.courses) do
					if num and (v == courses[abbr][num]) then
						proceed1 = false
					end
					if num2 and (v == courses[abbr][num2]) then
						proceed2 = false
					end
				end
				table.insert(curgroup.courses, courses[abbr][num])
				if num2 then
					table.insert(curgroup.courses, courses[abbr][num2])
				end
			end
		else
			curgroup = {}
			curgroup.name = line
		end
	end
end

-- Begin the sql
local group_sql = {}
local grp_crs_sql = {}
local grpprint = function(s) table.insert(group_sql, s) end
local gcrsprint = function(s) table.insert(grp_crs_sql, s) end

local g_id = 0
for i,v in ipairs(majors) do
	local major_id = v[3]
	if not major_id then break end
	for i,group in ipairs(v.groups) do
		local priority = i
		group.id = g_id
		g_id = g_id + 1
		grpprint("( "..group.id..", "..major_id..", '"..group.name.."', "..priority..", "..(group.qty or -1)..")")
		for i, course in ipairs(group.courses) do
			gcrsprint("( ".. group.id ..", ".. course.id ..")")
		end
	end
end

gprint([[INSERT INTO sch.program_group
( program_group_id, program_id, name, priority, min_credits )
VALUES]])
gprint(table.concat(group_sql, ",\n")..";")

gprint([[INSERT INTO sch.program_group_course
( program_group_id, course_id )
VALUES]])
gprint(table.concat(grp_crs_sql, ",\n")..";")
