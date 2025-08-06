import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    FlatList,
    Text,
    TextInput,
    View,
    StyleSheet,
    Alert,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';


const API_URL = 'http://192.168.0.100:8000';

export default function App() {
    const [books, setBooks] = useState([]);
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [year, setYear] = useState('');
    const [description, setDescription] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/books`);
            setBooks(res.data);
        } catch (err) {
            Alert.alert('Error', 'Failed to fetch books. Check your API URL and server connection.');
            console.error('Fetch books error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setAuthor('');
        setYear('');
        setDescription('');
        setEditingId(null);
    };

    const handleSubmit = async () => {
        if (!title.trim() || !author.trim()) {
            Alert.alert('Validation', 'Title and author are required.');
            return;
        }

        const data = {
            title: title.trim(),
            author: author.trim(),
            year: year ? parseInt(year, 10) : undefined,
            description: description.trim(),
        };

        setLoading(true);

        try {
            if (editingId) {
                await axios.put(`${API_URL}/books/${editingId}`, data);
                Alert.alert('Success', 'Book updated successfully!');
            } else {
                await axios.post(`${API_URL}/books`, data);
                Alert.alert('Success', 'Book added successfully!');
            }
            fetchBooks();
            resetForm();
        } catch (err) {
            Alert.alert('Error', `Failed to ${editingId ? 'update' : 'add'} book. Check your network and API.`);
            console.error('Submit book error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Alert.alert(
            'Delete Book',
            'Are you sure you want to delete this book?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await axios.delete(`${API_URL}/books/${id}`);
                            Alert.alert('Success', 'Book deleted successfully!');
                            fetchBooks();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete book. Check your network and API.');
                            console.error('Delete book error:', err);
                        } finally {
                            setLoading(false);
                        }
                    },
                    style: 'destructive',
                },
            ],
            { cancelable: false }
        );
    };

    const startEdit = (book) => {
        setEditingId(book.id);
        setTitle(book.title);
        setAuthor(book.author);
        setYear(book.year ? book.year.toString() : '');
        setDescription(book.description || '');
    };

    const renderBookItem = ({ item }) => (
        <View style={styles.bookCard}>
            <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>{item.title}</Text>
                <Text style={styles.bookAuthor}>by {item.author}</Text>
                <Text style={styles.bookDetails}>
                    {item.year || 'N/A'} | {item.description || 'No description provided.'}
                </Text>
            </View>
            <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.actionButton} onPress={() => startEdit(item)}>
                    <Ionicons name="create-outline" size={24} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={24} color="#FF3B30" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderForm = () => (
        <View style={styles.formContainer}>
            <Text style={styles.formHeader}>{editingId ? 'Edit Book' : 'Add a New Book'}</Text>
            <TextInput
                placeholder="Title"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
                placeholderTextColor="#888"
            />
            <TextInput
                key="author-input" 
                placeholder="Author"
                value={author}
                onChangeText={setAuthor}
                style={styles.input}
                placeholderTextColor="#888"
            />
            <TextInput
                key="year-input" 
                placeholder="Publication Year"
                value={year}
                onChangeText={setYear}
                keyboardType="numeric"
                style={styles.input}
                placeholderTextColor="#888"
            />
            <TextInput
                key="description-input" 
                placeholder="Description"
                value={description}
                onChangeText={setDescription}
                multiline
                style={[styles.input, styles.textArea]}
                placeholderTextColor="#888"
            />
            <View style={styles.buttonGroup}>
                <TouchableOpacity
                    style={[styles.actionButtonPrimary, loading && styles.disabledButton]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>{editingId ? 'Update Book' : 'Add Book'}</Text>
                </TouchableOpacity>
                {editingId && (
                    <TouchableOpacity
                        style={[styles.actionButtonSecondary, loading && styles.disabledButton]}
                        onPress={resetForm}
                        disabled={loading}
                    >
                        <Text style={styles.buttonTextSecondary}>Cancel</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Book Tracker</Text>
                <Ionicons name="library-outline" size={30} color="#fff" />
            </View>
            {loading && books.length === 0 ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#3498db" />
                    <Text style={styles.loadingText}>Loading books...</Text>
                </View>
            ) : (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    {renderForm()}

                    <FlatList
                        data={books}
                        renderItem={renderBookItem}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.bookListContent}
                        ListEmptyComponent={() => (
                            <Text style={styles.emptyListText}>No books added yet. Add one above!</Text>
                        )}
                        ListFooterComponent={<View style={{ height: 20 }} />}
                    />
                </KeyboardAvoidingView>

            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#34495e',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    headerText: {
        color: '#fff',
        fontSize: 28,
        fontWeight: 'bold',
        marginRight: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, fontSize: 18, color: '#555' },
    bookListContent: { padding: 20 },
    emptyListText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#888' },
    bookCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    bookInfo: { flex: 1, marginRight: 15 },
    bookTitle: { fontSize: 18, fontWeight: '600', color: '#2c3e50' },
    bookAuthor: { fontSize: 15, color: '#7f8c8d', marginTop: 2 },
    bookDetails: { fontSize: 14, color: '#95a5a6', marginTop: 5 },
    actionButtons: { flexDirection: 'row', alignItems: 'center' },
    actionButton: { marginLeft: 10, padding: 8, borderRadius: 5, backgroundColor: '#ecf0f1' },
    formContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    formHeader: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color: '#2c3e50', textAlign: 'center' },
    input: {
        height: 50,
        borderColor: '#bdc3c7',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
        backgroundColor: '#ecf0f1',
        color: '#2c3e50',
    },
    textArea: { height: 100, textAlignVertical: 'top', paddingTop: 15 },
    buttonGroup: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    actionButtonPrimary: {
        flex: 1,
        backgroundColor: '#3498db',
        borderRadius: 8,
        paddingVertical: 15,
        alignItems: 'center',
    },
    actionButtonSecondary: {
        flex: 1,
        marginLeft: 10,
        backgroundColor: '#95a5a6',
        borderRadius: 8,
        paddingVertical: 15,
        alignItems: 'center',
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    buttonTextSecondary: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    disabledButton: { opacity: 0.6 },
});