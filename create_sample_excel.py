#!/usr/bin/env python3
import openpyxl
from openpyxl import Workbook
import os

wb = Workbook()
ws = wb.active

ws['A1'] = 'RuleSet'
ws['B1'] = 'CustomerRules'
ws['A2'] = 'Import'
ws['B2'] = 'com.example.model.Customer'
ws['A3'] = 'Variables'
ws['B3'] = 'Customer customer'
ws['A4'] = 'Sequential'
ws['B4'] = 'TRUE'

ws['A6'] = 'RuleTable'
ws['B6'] = 'CustomerDiscountRules'

ws['A7'] = 'NAME'
ws['B7'] = 'CONDITION'
ws['C7'] = 'CONDITION2'
ws['D7'] = 'ACTION'

ws['A8'] = ''
ws['B8'] = 'customer.getAge() >= $param'
ws['C8'] = 'customer.getStatus() == "$param"'
ws['D8'] = 'customer.setDiscount($param);'

ws['A9'] = 'YoungAdultRule'
ws['B9'] = '18'
ws['C9'] = 'ACTIVE'
ws['D9'] = '0.05'

ws['A10'] = 'SeniorRule'
ws['B10'] = '65'
ws['C10'] = 'SENIOR'
ws['D10'] = '0.15'

ws['A11'] = 'PremiumRule'
ws['B11'] = '25'
ws['C11'] = 'PREMIUM'
ws['D11'] = '0.10'

os.makedirs('rules', exist_ok=True)
wb.save('rules/SampleRules.xlsx')
print("Created Drools-compliant sample Excel file: rules/SampleRules.xlsx")
