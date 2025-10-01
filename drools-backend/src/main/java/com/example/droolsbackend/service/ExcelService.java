package com.example.droolsbackend.service;

import com.example.droolsbackend.model.DecisionTableView;
import com.example.droolsbackend.model.RuleRow;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class ExcelService {

    @Autowired
    private RepositoryConfigService repositoryConfigService;
    
    @Autowired
    private DroolsService droolsService;

    public List<String> listExcelFiles() {
        String repositoryPath = repositoryConfigService.getRepositoryPath();
        if (repositoryPath == null) {
            return new ArrayList<>();
        }
        
        File rulesDir = new File(repositoryPath + "/rules/");
        List<String> excelFiles = new ArrayList<>();
        
        if (rulesDir.exists() && rulesDir.isDirectory()) {
            File[] files = rulesDir.listFiles((dir, name) -> name.toLowerCase().endsWith(".xlsx"));
            if (files != null) {
                for (File file : files) {
                    excelFiles.add(file.getName());
                }
            }
        }
        
        return excelFiles;
    }

    public DecisionTableView readDecisionTable(String fileName) throws IOException {
        String repositoryPath = repositoryConfigService.getRepositoryPath();
        if (repositoryPath == null) {
            throw new RuntimeException("Repository not configured");
        }
        
        File excelFile = new File(repositoryPath + "/rules/" + fileName);
        
        try (FileInputStream fis = new FileInputStream(excelFile);
             Workbook workbook = new XSSFWorkbook(fis)) {
            
            Sheet sheet = workbook.getSheetAt(0);
            
            Row headerRow = null;
            int headerRowIndex = -1;
            
            for (int i = 0; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row != null) {
                    Cell firstCell = row.getCell(0);
                    if (firstCell != null && "NAME".equals(getCellValueAsString(firstCell))) {
                        headerRow = row;
                        headerRowIndex = i;
                        break;
                    }
                }
            }
            
            if (headerRow == null) {
                throw new RuntimeException("Could not find header row with NAME column");
            }
            
            List<String> columnLabels = new ArrayList<>();
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                Cell cell = headerRow.getCell(i);
                String value = getCellValueAsString(cell);
                if (value != null && !value.trim().isEmpty()) {
                    columnLabels.add(value);
                }
            }
            
            List<String> templateLabels = new ArrayList<>();
            Row templateRow = sheet.getRow(headerRowIndex + 1);
            if (templateRow != null) {
                for (int i = 0; i < columnLabels.size(); i++) {
                    Cell cell = templateRow.getCell(i);
                    String value = getCellValueAsString(cell);
                    templateLabels.add(value != null ? value : "");
                }
            } else {
                for (int i = 0; i < columnLabels.size(); i++) {
                    templateLabels.add("");
                }
            }
            
            int dataStartRow = headerRowIndex + 2;
            
            List<RuleRow> rows = new ArrayList<>();
            for (int i = dataStartRow; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row != null) {
                    String name = getCellValueAsString(row.getCell(0));
                    if (name != null && !name.trim().isEmpty()) {
                        List<Object> values = new ArrayList<>();
                        
                        for (int j = 1; j < columnLabels.size(); j++) {
                            Cell cell = row.getCell(j);
                            Object value = getCellValue(cell);
                            values.add(value);
                        }
                        
                        rows.add(new RuleRow(name, values));
                    }
                }
            }
            
            return new DecisionTableView(columnLabels, templateLabels, rows);
        }
    }

    public void saveDecisionTable(String fileName, DecisionTableView view) throws IOException {
        String repositoryPath = repositoryConfigService.getRepositoryPath();
        if (repositoryPath == null) {
            throw new RuntimeException("Repository not configured");
        }
        
        File excelFile = new File(repositoryPath + "/rules/" + fileName);
        
        try (FileInputStream fis = new FileInputStream(excelFile);
             Workbook workbook = new XSSFWorkbook(fis)) {
            
            Sheet sheet = workbook.getSheetAt(0);
            
            int headerRowIndex = -1;
            for (int i = 0; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row != null) {
                    Cell firstCell = row.getCell(0);
                    if (firstCell != null && "NAME".equals(getCellValueAsString(firstCell))) {
                        headerRowIndex = i;
                        break;
                    }
                }
            }
            
            if (headerRowIndex == -1) {
                throw new RuntimeException("Could not find header row");
            }
            
            int dataStartRow = headerRowIndex + 2;
            for (int i = dataStartRow; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row != null) {
                    sheet.removeRow(row);
                }
            }
            
            for (int i = 0; i < view.getRows().size(); i++) {
                RuleRow ruleRow = view.getRows().get(i);
                Row row = sheet.createRow(dataStartRow + i);
                
                Cell nameCell = row.createCell(0);
                nameCell.setCellValue(ruleRow.getName());
                
                for (int j = 0; j < ruleRow.getValues().size(); j++) {
                    Cell cell = row.createCell(j + 1);
                    Object value = ruleRow.getValues().get(j);
                    setCellValue(cell, value);
                }
            }
            
            try (FileOutputStream fos = new FileOutputStream(excelFile)) {
                workbook.write(fos);
            }
        }
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    return String.valueOf(cell.getNumericCellValue());
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return null;
        }
    }

    private Object getCellValue(Cell cell) {
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue();
                } else {
                    return cell.getNumericCellValue();
                }
            case BOOLEAN:
                return cell.getBooleanCellValue();
            case FORMULA:
                return cell.getCellFormula();
            default:
                return null;
        }
    }

    public void addColumn(String fileName, String columnType, String columnName, String templateValue) throws IOException {
        String repositoryPath = repositoryConfigService.getRepositoryPath();
        if (repositoryPath == null) {
            throw new RuntimeException("Repository not configured");
        }
        
        File excelFile = new File(repositoryPath + "/rules/" + fileName);
        
        try (FileInputStream fis = new FileInputStream(excelFile);
             Workbook workbook = new XSSFWorkbook(fis)) {
            
            Sheet sheet = workbook.getSheetAt(0);
            
            int headerRowIndex = -1;
            Row headerRow = null;
            for (int i = 0; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row != null) {
                    Cell firstCell = row.getCell(0);
                    if (firstCell != null && "NAME".equals(getCellValueAsString(firstCell))) {
                        headerRow = row;
                        headerRowIndex = i;
                        break;
                    }
                }
            }
            
            if (headerRow == null) {
                throw new RuntimeException("Could not find header row with NAME column");
            }
            
            List<String> existingColumns = new ArrayList<>();
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                Cell cell = headerRow.getCell(i);
                String value = getCellValueAsString(cell);
                if (value != null && !value.trim().isEmpty()) {
                    existingColumns.add(value);
                }
            }
            
            String droolsColumnName = droolsService.generateDroolsColumnName(columnType, existingColumns);
            String droolsTemplateValue = templateValue != null && !templateValue.trim().isEmpty() 
                ? templateValue 
                : droolsService.getDefaultTemplateValue(columnType);
            
            int insertPosition = findInsertPosition(headerRow, columnType);
            
            insertColumnAtPosition(sheet, headerRowIndex, insertPosition, droolsColumnName, droolsTemplateValue);
            
            try (FileOutputStream fos = new FileOutputStream(excelFile)) {
                workbook.write(fos);
            }
        }
    }

    public void deleteColumn(String fileName, int columnIndex) throws IOException {
        String repositoryPath = repositoryConfigService.getRepositoryPath();
        if (repositoryPath == null) {
            throw new RuntimeException("Repository not configured");
        }
        
        File excelFile = new File(repositoryPath + "/rules/" + fileName);
        
        try (FileInputStream fis = new FileInputStream(excelFile);
             Workbook workbook = new XSSFWorkbook(fis)) {
            
            Sheet sheet = workbook.getSheetAt(0);
            
            int headerRowIndex = -1;
            Row headerRow = null;
            for (int i = 0; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row != null) {
                    Cell firstCell = row.getCell(0);
                    if (firstCell != null && "NAME".equals(getCellValueAsString(firstCell))) {
                        headerRow = row;
                        headerRowIndex = i;
                        break;
                    }
                }
            }
            
            if (headerRow == null) {
                throw new RuntimeException("Could not find header row with NAME column");
            }
            
            validateColumnDeletion(headerRow, columnIndex);
            
            removeColumnAtPosition(sheet, headerRowIndex, columnIndex);
            
            try (FileOutputStream fos = new FileOutputStream(excelFile)) {
                workbook.write(fos);
            }
        }
    }

    private int findInsertPosition(Row headerRow, String columnType) {
        int lastConditionIndex = 0;
        int lastActionIndex = 0;
        
        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            Cell cell = headerRow.getCell(i);
            String value = getCellValueAsString(cell);
            if (value != null) {
                if (value.startsWith("CONDITION")) {
                    lastConditionIndex = i;
                } else if (value.startsWith("ACTION")) {
                    lastActionIndex = i;
                }
            }
        }
        
        if ("CONDITION".equals(columnType)) {
            return lastConditionIndex > 0 ? lastConditionIndex + 1 : 1;
        } else {
            return lastActionIndex > 0 ? lastActionIndex + 1 : headerRow.getLastCellNum();
        }
    }

    private void insertColumnAtPosition(Sheet sheet, int headerRowIndex, int insertPosition, String columnName, String templateValue) {
        for (int rowIndex = 0; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row != null) {
                int lastCellNum = row.getLastCellNum();
                
                for (int cellIndex = lastCellNum; cellIndex > insertPosition; cellIndex--) {
                    Cell oldCell = row.getCell(cellIndex - 1);
                    Cell newCell = row.createCell(cellIndex);
                    if (oldCell != null) {
                        copyCellValue(oldCell, newCell);
                        row.removeCell(oldCell);
                    }
                }
                
                Cell newCell = row.createCell(insertPosition);
                if (rowIndex == headerRowIndex) {
                    newCell.setCellValue(columnName);
                } else if (rowIndex == headerRowIndex + 1) {
                    newCell.setCellValue(templateValue);
                } else {
                    newCell.setBlank();
                }
            }
        }
    }

    private void removeColumnAtPosition(Sheet sheet, int headerRowIndex, int columnIndex) {
        for (int rowIndex = 0; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row != null) {
                int lastCellNum = row.getLastCellNum();
                
                row.removeCell(row.getCell(columnIndex));
                
                for (int cellIndex = columnIndex + 1; cellIndex < lastCellNum; cellIndex++) {
                    Cell oldCell = row.getCell(cellIndex);
                    if (oldCell != null) {
                        Cell newCell = row.createCell(cellIndex - 1);
                        copyCellValue(oldCell, newCell);
                        row.removeCell(oldCell);
                    }
                }
            }
        }
    }

    private void copyCellValue(Cell source, Cell target) {
        if (source == null) return;
        
        switch (source.getCellType()) {
            case STRING:
                target.setCellValue(source.getStringCellValue());
                break;
            case NUMERIC:
                target.setCellValue(source.getNumericCellValue());
                break;
            case BOOLEAN:
                target.setCellValue(source.getBooleanCellValue());
                break;
            case FORMULA:
                target.setCellFormula(source.getCellFormula());
                break;
            default:
                target.setBlank();
                break;
        }
    }

    private void validateColumnDeletion(Row headerRow, int columnIndex) {
        if (columnIndex == 0) {
            throw new RuntimeException("Cannot delete NAME column - it is mandatory for Drools decision tables");
        }
        
        Cell cellToDelete = headerRow.getCell(columnIndex);
        String columnLabel = getCellValueAsString(cellToDelete);
        
        int conditionCount = 0;
        int actionCount = 0;
        
        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            Cell cell = headerRow.getCell(i);
            String value = getCellValueAsString(cell);
            if (value != null) {
                if (value.startsWith("CONDITION")) {
                    conditionCount++;
                } else if (value.startsWith("ACTION")) {
                    actionCount++;
                }
            }
        }
        
        if (columnLabel != null && columnLabel.startsWith("CONDITION") && conditionCount <= 1) {
            throw new RuntimeException("Cannot delete the last CONDITION column. Drools decision tables require at least one CONDITION column.");
        }
        
        if (columnLabel != null && columnLabel.startsWith("ACTION") && actionCount <= 1) {
            throw new RuntimeException("Cannot delete the last ACTION column. Drools decision tables require at least one ACTION column.");
        }
    }

    private void setCellValue(Cell cell, Object value) {
        if (value == null) {
            cell.setBlank();
        } else if (value instanceof String) {
            cell.setCellValue((String) value);
        } else if (value instanceof Number) {
            cell.setCellValue(((Number) value).doubleValue());
        } else if (value instanceof Boolean) {
            cell.setCellValue((Boolean) value);
        } else {
            cell.setCellValue(value.toString());
        }
    }
}
