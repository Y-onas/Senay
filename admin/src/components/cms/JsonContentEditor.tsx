import { useEffect, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  type ContentField,
  contentToFields,
  fieldsToContent,
  fingerprintContent,
  inferComplexMode,
} from '@/lib/json-content-editor'

type JsonContentEditorProps = {
  label?: string
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
}

export function JsonContentEditor({ label, value, onChange }: JsonContentEditorProps) {
  const [fields, setFields] = useState<ContentField[]>(() => contentToFields(value))
  const fingerprint = useRef(fingerprintContent(value))

  useEffect(() => {
    const next = fingerprintContent(value)
    if (next !== fingerprint.current) {
      fingerprint.current = next
      setFields(contentToFields(value))
    }
  }, [value])

  const updateFields = (updater: (prev: ContentField[]) => ContentField[]) => {
    setFields((prev) => {
      const next = updater(prev)
      const content = fieldsToContent(next)
      fingerprint.current = fingerprintContent(content)
      onChange(content)
      return next
    })
  }

  return (
    <div className="space-y-3">
      {label ? <Label>{label}</Label> : null}
      <div className="space-y-2">
        {fields.map((field) => (
          <div key={field.id} className="grid grid-cols-12 gap-2">
            <Input
              className="col-span-3"
              placeholder="field"
              value={field.key}
              onChange={(e) =>
                updateFields((prev) =>
                  prev.map((row) => (row.id === field.id ? { ...row, key: e.target.value } : row)),
                )
              }
            />
            <Select
              value={field.type}
              onValueChange={(type) =>
                updateFields((prev) =>
                  prev.map((row) => {
                    if (row.id !== field.id) return row
                    if (type === 'json') {
                      const complexMode = inferComplexMode(row.key)
                      return {
                        ...row,
                        type: 'json',
                        complexMode,
                        complexPairs:
                          complexMode === 'pairs'
                            ? [{ id: `${row.id}-pair-0`, key: '', value: '' }]
                            : row.complexPairs,
                        complexItems: complexMode === 'list' ? [''] : row.complexItems,
                        value: row.value || '{}',
                      }
                    }
                    return {
                      ...row,
                      type: type as ContentField['type'],
                      value: type === 'boolean' ? 'false' : row.value,
                    }
                  }),
                )
              }
            >
              <SelectTrigger className="col-span-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="boolean">True/False</SelectItem>
                <SelectItem value="json">Complex</SelectItem>
              </SelectContent>
            </Select>

            {field.type === 'boolean' ? (
              <Select
                value={field.value}
                onValueChange={(next) =>
                  updateFields((prev) =>
                    prev.map((row) => (row.id === field.id ? { ...row, value: next } : row)),
                  )
                }
              >
                <SelectTrigger className="col-span-6">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">true</SelectItem>
                  <SelectItem value="false">false</SelectItem>
                </SelectContent>
              </Select>
            ) : field.type === 'json' ? (
              <div className="col-span-6 space-y-2 rounded-md border p-2">
                <p className="text-xs text-muted-foreground">
                  {(field.complexMode ?? inferComplexMode(field.key)) === 'list'
                    ? 'List editor'
                    : 'Fields editor'}
                </p>
                {(field.complexMode ?? inferComplexMode(field.key)) === 'pairs' ? (
                  <div className="space-y-2">
                    {(field.complexPairs ?? []).map((pair) => (
                      <div key={pair.id} className="grid grid-cols-12 gap-2">
                        <Input
                          className="col-span-5"
                          placeholder="field name"
                          value={pair.key}
                          onChange={(e) =>
                            updateFields((prev) =>
                              prev.map((row) =>
                                row.id === field.id
                                  ? {
                                      ...row,
                                      complexPairs: (row.complexPairs ?? []).map((entry) =>
                                        entry.id === pair.id ? { ...entry, key: e.target.value } : entry,
                                      ),
                                    }
                                  : row,
                              ),
                            )
                          }
                        />
                        <Input
                          className="col-span-6"
                          placeholder="value"
                          value={pair.value}
                          onChange={(e) =>
                            updateFields((prev) =>
                              prev.map((row) =>
                                row.id === field.id
                                  ? {
                                      ...row,
                                      complexPairs: (row.complexPairs ?? []).map((entry) =>
                                        entry.id === pair.id ? { ...entry, value: e.target.value } : entry,
                                      ),
                                    }
                                  : row,
                              ),
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="col-span-1"
                          onClick={() =>
                            updateFields((prev) =>
                              prev.map((row) =>
                                row.id === field.id
                                  ? {
                                      ...row,
                                      complexPairs: (row.complexPairs ?? []).filter(
                                        (entry) => entry.id !== pair.id,
                                      ),
                                    }
                                  : row,
                              ),
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        updateFields((prev) =>
                          prev.map((row) =>
                            row.id === field.id
                              ? {
                                  ...row,
                                  complexPairs: [
                                    ...(row.complexPairs ?? []),
                                    {
                                      id: `${row.id}-pair-${(row.complexPairs ?? []).length}`,
                                      key: '',
                                      value: '',
                                    },
                                  ],
                                }
                              : row,
                          ),
                        )
                      }
                    >
                      Add property
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(field.complexItems ?? []).map((item, index) => (
                      <div key={`${field.id}-item-${index}`} className="grid grid-cols-12 gap-2">
                        <Input
                          className="col-span-11"
                          placeholder={`Item ${index + 1}`}
                          value={item}
                          onChange={(e) =>
                            updateFields((prev) =>
                              prev.map((row) =>
                                row.id === field.id
                                  ? {
                                      ...row,
                                      complexItems: (row.complexItems ?? []).map((entry, idx) =>
                                        idx === index ? e.target.value : entry,
                                      ),
                                    }
                                  : row,
                              ),
                            )
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="col-span-1"
                          onClick={() =>
                            updateFields((prev) =>
                              prev.map((row) =>
                                row.id === field.id
                                  ? {
                                      ...row,
                                      complexItems: (row.complexItems ?? []).filter(
                                        (_, idx) => idx !== index,
                                      ),
                                    }
                                  : row,
                              ),
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        updateFields((prev) =>
                          prev.map((row) =>
                            row.id === field.id
                              ? { ...row, complexItems: [...(row.complexItems ?? []), ''] }
                              : row,
                          ),
                        )
                      }
                    >
                      Add list item
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Input
                className="col-span-6"
                placeholder="value"
                value={field.value}
                onChange={(e) =>
                  updateFields((prev) =>
                    prev.map((row) => (row.id === field.id ? { ...row, value: e.target.value } : row)),
                  )
                }
              />
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="col-span-1"
              onClick={() => updateFields((prev) => prev.filter((row) => row.id !== field.id))}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() =>
          updateFields((prev) => [
            ...prev,
            {
              id: `field-${Date.now()}`,
              key: '',
              type: 'string',
              value: '',
            },
          ])
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        Add field
      </Button>
    </div>
  )
}
